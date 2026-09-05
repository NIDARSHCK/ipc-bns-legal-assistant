import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, Scale, Mail, Send, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "../services/supabase";

export default function ForgotPassword({ navigateTo }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpRefs = useRef([]);

  // If App.jsx routed here via #access_token
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setStep(3);
    }
  }, []);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSendEmail(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Verification code sent. Please check your email.");
      setCooldown(60); // 60 second cooldown for resend
      setStep(2);
    }
    setLoading(false);
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only numeric allowed
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 7) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  async function handleVerifyOtp(e) {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 8) {
      return setError("Please enter the 8-digit verification code.");
    }
    
    setLoading(true);
    setError("");
    setMessage("");

    const { error, data } = await supabase.auth.verifyOtp({
      email,
      token: otpString,
      type: "recovery",
    });

    if (error) {
      // Map Supabase errors to exact requested strings
      if (error.message.toLowerCase().includes("expired")) {
        setError("Verification code has expired. Please request a new code.");
      } else {
        setError("Invalid verification code.");
      }
    } else if (!error) {
      setMessage("Code verified successfully! You may now set a new password.");
      setStep(3);
    } else {
      setError("Invalid verification code.");
    }
    setLoading(false);
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset successfully.");
      setStep(4);
      setOtp(["", "", "", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
      await supabase.auth.signOut();
    }
    setLoading(false);
  }

  return (
    <div className="main-content">
      <div className="auth-wrapper">
        <div className="auth-bg"></div>
        <div className="auth-card-glass animate-slide-up">
          <div className="auth-header">
            <Scale size={48} color="var(--accent-gold)" />
            <h2>
              {step === 1 && "Forgot Password"}
              {step === 2 && "Verify Your Email"}
              {step === 3 && "Reset Password"}
              {step === 4 && "Password Reset"}
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
              {step === 1 && "Enter your email to receive a recovery code"}
              {step === 2 && (
                <>
                  We sent an 8-digit verification code to:<br/>
                  <strong>{email}</strong>
                </>
              )}
              {step === 3 && "Please enter your new password below"}
              {step === 4 && "Your password has been updated successfully"}
            </p>
          </div>

          <div style={{ padding: "0 24px" }}>
            {error && (
              <div className="auth-error">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            {message && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(76, 175, 80, 0.1)",
                  border: "1px solid rgba(76, 175, 80, 0.3)",
                  borderRadius: "8px",
                  color: "#4caf50",
                  marginBottom: "16px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <ShieldCheck size={18} /> {message}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSendEmail}>
                <div className="form-group">
                  <label>Email</label>
                  <div className="input-icon-wrapper">
                    <Mail size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="advocate@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginBottom: "24px", height: "52px", fontSize: "16px" }}
                  disabled={loading}
                >
                  <Send size={20} />
                  {loading ? "Sending..." : "Send Code"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label style={{ textAlign: "center", display: "block" }}>Verification Code</label>
                  <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "12px" }}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        style={{
                          width: "38px",
                          height: "50px",
                          textAlign: "center",
                          fontSize: "22px",
                          fontWeight: "bold",
                          borderRadius: "8px",
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-secondary)",
                          color: "var(--text-primary)"
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginBottom: "24px", height: "52px", fontSize: "16px", marginTop: "16px" }}
                  disabled={loading}
                >
                  <ShieldCheck size={20} />
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={loading || cooldown > 0}
                    style={{ background: "none", border: "none", color: cooldown > 0 ? "var(--text-muted)" : "var(--accent-gold)", fontSize: "14px", cursor: cooldown > 0 ? "not-allowed" : "pointer", fontWeight: "500" }}
                  >
                    {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend Code"}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleUpdatePassword}>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-icon-wrapper">
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                        {showPassword ? "HIDE" : "SHOW"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="input-icon-wrapper">
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginBottom: "24px", height: "52px", fontSize: "16px" }}
                  disabled={loading}
                >
                  <Lock size={20} />
                  {loading ? "Updating..." : "Reset Password"}
                </button>
              </form>
            )}

            {step === 4 && (
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <button
                  type="button"
                  onClick={() => navigateTo("signin")}
                  className="btn btn-primary"
                  style={{ width: "100%", height: "52px", fontSize: "16px" }}
                >
                  Go to Sign In
                </button>
              </div>
            )}
          </div>

          {(step === 1 || step === 2) && (
            <div style={{ textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "24px", margin: "0 24px 24px" }}>
              <button
                className="btn-ghost"
                type="button"
                style={{ fontSize: "15px", fontWeight: 500 }}
                onClick={() => navigateTo("signin")}
              >
                Remember your password? Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

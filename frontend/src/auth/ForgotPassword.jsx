import React, { useState, useEffect } from "react";
import { AlertCircle, Scale, Mail, Send, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "../services/supabase";

export default function ForgotPassword({ navigateTo }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If App.jsx routed here via #access_token (fallback for users who click the link instead of using OTP)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      // If they clicked a magic link, Supabase already verified them.
      // Move directly to step 3.
      setStep(3);
    }
  }, []);

  async function handleSendEmail(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
    } else {
      setMessage("A 6-digit verification code has been sent to your email.");
      setStep(2);
    }
    setLoading(false);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error, data } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });

    if (error) {
      setError(error.message);
    } else if (data?.session) {
      setMessage("Code verified successfully! You may now set a new password.");
      setStep(3);
    } else {
      setError("Verification failed. Please try again.");
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
      setMessage("Your password has been reset successfully.");
      setStep(4);
      // Clean up the recovery session
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
              {step === 1 && "Reset Password"}
              {step === 2 && "Verification Code"}
              {step === 3 && "Set New Password"}
              {step === 4 && "Password Reset"}
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
              {step === 1 && "Enter your email to receive a recovery code"}
              {step === 2 && "Enter the 6-digit code sent to your email"}
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

            {/* STEP 1: ENTER EMAIL */}
            {step === 1 && (
              <form onSubmit={handleSendEmail}>
                <div className="form-group">
                  <label>Email Address</label>
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

            {/* STEP 2: ENTER OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label>6-Digit Code</label>
                  <div className="input-icon-wrapper">
                    <KeyRound size={18} />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="• • • • • •"
                      maxLength={6}
                      required
                      style={{ letterSpacing: "8px", textAlign: "center", fontWeight: "bold" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginBottom: "24px", height: "52px", fontSize: "16px" }}
                  disabled={loading}
                >
                  <ShieldCheck size={20} />
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={loading}
                    style={{ background: "none", border: "none", color: "var(--accent-gold)", fontSize: "14px", cursor: "pointer" }}
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: RESET PASSWORD */}
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

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => navigateTo("signin")}
                  className="btn btn-primary"
                  style={{ width: "100%", marginBottom: "24px", height: "52px", fontSize: "16px" }}
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

import React, { useState, useEffect } from "react";
import { AlertCircle, Scale, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "../services/supabase";

export default function ResetPassword({ navigateTo }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // We already verified hash in App.jsx and routed here, but we can double check session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired recovery link. Please request a new password reset.");
      }
    };
    checkSession();
  }, []);

  async function handleUpdate(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Your password has been successfully updated!");
      setTimeout(() => navigateTo("signin"), 3000);
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
            <h2>Set New Password</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
              Please enter your new password below
            </p>
          </div>
          
          <form onSubmit={handleUpdate}>
            {error && (
              <div className="auth-error">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            {message && (
              <div style={{ padding: "12px", background: "rgba(76, 175, 80, 0.1)", border: "1px solid rgba(76, 175, 80, 0.3)", borderRadius: "8px", color: "#4caf50", marginBottom: "16px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} /> {message}
              </div>
            )}

            <div className="form-group">
              <label>New Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "12px", fontWeight: "bold" }}>{showPassword ? "HIDE" : "SHOW"}</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
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

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginBottom: "24px", height: "52px", fontSize: "16px" }} disabled={loading || !!message}>
              <ShieldCheck size={20} />
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

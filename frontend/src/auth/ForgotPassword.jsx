import React, { useState } from "react";
import { AlertCircle, Scale, Mail, Send } from "lucide-react";
import { supabase } from "../services/supabase";

export default function ForgotPassword({ navigateTo }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset instructions have been sent to your email.");
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
            <h2>Reset Password</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
              Enter your email to receive recovery instructions
            </p>
          </div>
          
          <form onSubmit={handleReset}>
            {error && (
              <div className="auth-error">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            {message && (
              <div style={{ padding: "12px", background: "rgba(76, 175, 80, 0.1)", border: "1px solid rgba(76, 175, 80, 0.3)", borderRadius: "8px", color: "#4caf50", marginBottom: "16px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={18} /> {message}
              </div>
            )}

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

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginBottom: "24px", height: "52px", fontSize: "16px" }} disabled={loading}>
              <Send size={20} />
              {loading ? "Sending..." : "Send Instructions"}
            </button>

            <div style={{ textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>
              <button 
                className="btn-ghost" 
                type="button" 
                style={{ fontSize: "15px", fontWeight: 500 }}
                onClick={() => navigateTo("signin")}
              >
                Remember your password? Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

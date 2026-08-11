import React, { useState } from "react";
import { Scale, Mail } from "lucide-react";
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
    <div className="auth-container animate-slide-up">
      <div className="auth-card">
        <div className="auth-header">
          <Scale size={32} color="var(--accent-gold)" />
          <h2>Reset Password</h2>
          <p>Enter your email to receive recovery instructions</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        {message && <div style={{ padding: "12px", background: "rgba(76, 175, 80, 0.1)", border: "1px solid rgba(76, 175, 80, 0.3)", borderRadius: "8px", color: "#4caf50", marginBottom: "16px", fontSize: "14px" }}>{message}</div>}

        <form onSubmit={handleReset} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="advocate@example.com"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }} disabled={loading}>
            {loading ? "Sending..." : "Send Instructions"}
          </button>
        </form>

        <div className="auth-footer">
          Remember your password?{" "}
          <button onClick={() => navigateTo("signin")}>Sign in</button>
        </div>
      </div>
    </div>
  );
}

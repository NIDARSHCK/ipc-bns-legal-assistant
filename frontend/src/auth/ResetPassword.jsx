import React, { useState, useEffect } from "react";
import { Scale } from "lucide-react";
import { supabase } from "../services/supabase";

export default function ResetPassword({ navigateTo }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has recovery session active
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired recovery link. Please try resetting your password again.");
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
      setMessage("Your password has been successfully updated.");
      setTimeout(() => navigateTo("signin"), 3000);
    }
    setLoading(false);
  }

  return (
    <div className="auth-container animate-slide-up">
      <div className="auth-card">
        <div className="auth-header">
          <Scale size={32} color="var(--accent-gold)" />
          <h2>Set New Password</h2>
          <p>Please enter your new password below</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        {message && <div style={{ padding: "12px", background: "rgba(76, 175, 80, 0.1)", border: "1px solid rgba(76, 175, 80, 0.3)", borderRadius: "8px", color: "#4caf50", marginBottom: "16px", fontSize: "14px" }}>{message}</div>}

        <form onSubmit={handleUpdate} className="auth-form">
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }} disabled={loading || !!message}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="auth-footer">
          <button onClick={() => navigateTo("signin")}>Back to Sign in</button>
        </div>
      </div>
    </div>
  );
}

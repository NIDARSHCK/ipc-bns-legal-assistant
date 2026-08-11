import React from "react";
import { Scale } from "lucide-react";

export default function SignUp({ email, setEmail, password, setPassword, handleAuth, authMessage, navigateTo }) {
  return (
    <div className="auth-container animate-slide-up">
      <div className="auth-card">
        <div className="auth-header">
          <Scale size={32} color="var(--accent-gold)" />
          <h2>Create Account</h2>
          <p>Join NyayaSetu to research Indian laws</p>
        </div>
        
        {authMessage && (
          <div className="auth-error">
            {authMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="auth-form">
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
          <div className="form-group">
            <label>Password (min 6 characters)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
            Sign Up
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <button onClick={() => navigateTo("signin")}>Sign in</button>
        </div>
      </div>
    </div>
  );
}

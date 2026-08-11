import React from "react";
import { Scale } from "lucide-react";

export default function SignIn({ email, setEmail, password, setPassword, handleAuth, authMessage, navigateTo }) {
  return (
    <div className="auth-container animate-slide-up">
      <div className="auth-card">
        <div className="auth-header">
          <Scale size={32} color="var(--accent-gold)" />
          <h2>Welcome Back</h2>
          <p>Sign in to your NyayaSetu account</p>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <button 
                type="button" 
                onClick={() => navigateTo("forgotPassword")}
                style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <button onClick={() => navigateTo("signup")}>Sign up</button>
        </div>
      </div>
    </div>
  );
}

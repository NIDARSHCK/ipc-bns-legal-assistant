import React from "react";
import { AlertCircle, LogIn, Scale, Mail, Lock } from "lucide-react";

export default function SignIn({ email, setEmail, password, setPassword, handleAuth, authMessage, navigateTo }) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="main-content">
      <div className="auth-wrapper">
        <div className="auth-bg"></div>
        <div className="auth-card-glass animate-slide-up">
          <div className="auth-header">
            <Scale size={48} color="var(--accent-gold)" />
            <h2>Welcome Back</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
              Sign in to your secure legal workspace
            </p>
          </div>
          
          <form onSubmit={handleAuth}>
            {authMessage && (
              <div className="auth-error">
                <AlertCircle size={18} />
                {authMessage}
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

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "12px", fontWeight: "bold" }}>{showPassword ? "HIDE" : "SHOW"}</span>
                </button>
              </div>
              <div style={{ textAlign: "right", marginTop: "8px" }}>
                <button 
                  type="button" 
                  onClick={() => navigateTo("forgotPassword")}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: 0 }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginBottom: "24px", height: "52px", fontSize: "16px" }}>
              <LogIn size={20} />
              Sign In
            </button>

            <div style={{ textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>
              <button 
                className="btn-ghost" 
                type="button" 
                style={{ fontSize: "15px", fontWeight: 500 }}
                onClick={() => navigateTo("signup")}
              >
                Don't have an account? Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

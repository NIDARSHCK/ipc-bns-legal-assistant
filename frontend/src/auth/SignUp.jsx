import React from "react";
import { AlertCircle, UserPlus, Scale, Mail, Lock } from "lucide-react";

export default function SignUp({ email, setEmail, password, setPassword, handleAuth, authMessage, navigateTo }) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="main-content">
      <div className="auth-wrapper">
        <div className="auth-bg"></div>
        <div className="auth-card-glass animate-slide-up">
          <div className="auth-header">
            <Scale size={48} color="var(--accent-gold)" />
            <h2>Create Account</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
              Join NyayaSetu to research Indian laws
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
              <label>Password (min 6 characters)</label>
              <div className="input-icon-wrapper">
                <Lock size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
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
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginBottom: "24px", height: "52px", fontSize: "16px" }}>
              <UserPlus size={20} />
              Sign Up
            </button>

            <div style={{ textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>
              <button 
                className="btn-ghost" 
                type="button" 
                style={{ fontSize: "15px", fontWeight: 500 }}
                onClick={() => navigateTo("signin")}
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { AlertCircle, LogIn, UserPlus, Scale, Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function Auth({ mode, setMode, email, setEmail, password, setPassword, handleAuth, authMessage }) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="main-content">
      <div className="auth-wrapper">
        <div className="auth-bg"></div>
        <div className="auth-card-glass">
          <div className="auth-header">
            <Scale size={48} />
            <h2>{mode === "signin" ? "Welcome Back" : "Create Account"}</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
              Log in to access your secure legal workspace.
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
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  type="email" 
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
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  minLength={6} 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {mode === "signin" && (
                <div style={{ textAlign: "right", marginTop: "8px" }}>
                  <a href="#" style={{ fontSize: "13px", color: "var(--accent-gold)", fontWeight: 500 }}>Forgot Password?</a>
                </div>
              )}
            </div>

            <button className="btn btn-primary" style={{ width: "100%", marginBottom: "24px", height: "52px", fontSize: "16px" }} type="submit">
              {mode === "signin" ? <LogIn size={20} /> : <UserPlus size={20} />}
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </button>

            <div style={{ textAlign: "center", borderTop: "1px solid #E5E7EB", paddingTop: "24px" }}>
              <button 
                className="btn-ghost" 
                type="button" 
                style={{ fontSize: "15px", fontWeight: 500 }}
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

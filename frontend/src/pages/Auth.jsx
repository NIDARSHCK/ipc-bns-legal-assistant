import React from "react";
import { AlertCircle, LogIn, UserPlus } from "lucide-react";

export default function Auth({ mode, setMode, email, setEmail, password, setPassword, handleAuth, authMessage }) {
  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-content">
          <h1>Secure Access to Your Legal Workspace</h1>
          <p>Store research history, continue conversations, and access personalized legal assistance.</p>
        </div>
      </div>
      <div className="auth-right">
        <form className="auth-card" onSubmit={handleAuth}>
          <h2>{mode === "signin" ? "Sign In" : "Create Account"}</h2>
          <p>Enter your details to access the NyayaSetu assistant.</p>
          
          {authMessage && (
            <div className="auth-error">
              <AlertCircle size={16} />
              {authMessage}
            </div>
          )}

          <div className="form-group">
            <label>Email address</label>
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              placeholder="advocate@example.com"
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password" 
              placeholder="••••••••"
              minLength={6} 
              required 
            />
          </div>

          <button className="btn btn-primary" style={{ width: "100%", marginBottom: "16px" }} type="submit">
            {mode === "signin" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {mode === "signin" ? "Sign in to Workspace" : "Create Account"}
          </button>

          <div style={{ textAlign: "center" }}>
            <button 
              className="btn-ghost" 
              type="button" 
              style={{ fontSize: "14px", fontWeight: 500 }}
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

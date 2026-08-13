import React, { useState } from "react";
import { Scale, MailCheck, ArrowLeft, Send } from "lucide-react";
import { supabase } from "../services/supabase";

export default function VerifyEmail({ navigateTo, email }) {
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");

  const handleResend = async () => {
    if (!email) {
      setMessage("Email address not found. Please try signing up again.");
      return;
    }
    setResending(true);
    setMessage("");
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Verification email has been resent!");
    }
    setResending(false);
  };

  return (
    <div className="main-content">
      <div className="auth-wrapper">
        <div className="auth-bg"></div>
        <div className="auth-card-glass animate-slide-up" style={{ textAlign: "center", padding: "40px" }}>
          
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <div style={{ background: "rgba(255, 193, 7, 0.1)", padding: "20px", borderRadius: "50%", border: "1px solid rgba(255, 193, 7, 0.3)" }}>
              <MailCheck size={48} color="var(--accent-gold)" />
            </div>
          </div>
          
          <div className="auth-header" style={{ alignItems: "center" }}>
            <h2>Account created successfully.</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
              Please check your email and verify your email address before signing in.
            </p>
          </div>
          
          {message && (
            <div style={{ padding: "12px", background: message.startsWith("Error") ? "rgba(244, 67, 54, 0.1)" : "rgba(76, 175, 80, 0.1)", color: message.startsWith("Error") ? "#f44336" : "#4caf50", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
              {message}
            </div>
          )}

          <div style={{ padding: "24px 0", color: "var(--text-primary)", fontSize: "15px", lineHeight: "1.6" }}>
            We've sent a confirmation link to <strong>{email || "your email"}</strong>.
            If you don't see it, check your spam folder.
          </div>

          <button onClick={handleResend} className="btn btn-primary" style={{ width: "100%", marginTop: "12px", height: "52px", fontSize: "16px" }} disabled={resending}>
            <Send size={18} />
            {resending ? "Resending..." : "Resend Verification Email"}
          </button>

          <button onClick={() => navigateTo("signin")} className="btn btn-outline" style={{ width: "100%", marginTop: "12px", height: "52px", fontSize: "16px" }}>
            <ArrowLeft size={18} />
            Return to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

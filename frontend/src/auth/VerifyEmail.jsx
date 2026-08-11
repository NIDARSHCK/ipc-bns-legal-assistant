import React from "react";
import { Scale, MailCheck } from "lucide-react";

export default function VerifyEmail({ navigateTo }) {
  return (
    <div className="auth-container animate-slide-up">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-header" style={{ alignItems: "center" }}>
          <div style={{ background: "rgba(255, 193, 7, 0.1)", padding: "16px", borderRadius: "50%", marginBottom: "16px" }}>
            <MailCheck size={48} color="var(--accent-gold)" />
          </div>
          <h2>Check Your Email</h2>
          <p>We've sent a confirmation link to your email address.</p>
        </div>
        
        <div style={{ padding: "24px 0", color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6" }}>
          Please click the link in the email to verify your account and sign in.
          If you don't see it, check your spam folder.
        </div>

        <button onClick={() => navigateTo("signin")} className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
          Return to Sign In
        </button>
      </div>
    </div>
  );
}

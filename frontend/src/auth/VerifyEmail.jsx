import React from "react";
import { Scale, MailCheck, ArrowLeft } from "lucide-react";

export default function VerifyEmail({ navigateTo }) {
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
            <h2>Check Your Email</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
              We've sent a confirmation link to your email address.
            </p>
          </div>
          
          <div style={{ padding: "24px 0", color: "var(--text-primary)", fontSize: "15px", lineHeight: "1.6" }}>
            Please click the link in the email to verify your account and sign in.
            If you don't see it, check your spam folder.
          </div>

          <button onClick={() => navigateTo("signin")} className="btn btn-outline" style={{ width: "100%", marginTop: "12px", height: "52px", fontSize: "16px" }}>
            <ArrowLeft size={18} />
            Return to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

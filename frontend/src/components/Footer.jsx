import React from "react";
import { Scale } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ background: "var(--bg-secondary)", borderTop: "1px solid #E5E7EB", padding: "48px 32px 24px", marginTop: "auto" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px", marginBottom: "32px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "18px", marginBottom: "16px" }}>
            <Scale size={20} color="var(--accent-gold)" /> NyayaSetu
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
            Modernizing legal research for India’s criminal law transition.
          </p>
        </div>
        
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Quick Links</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
            <li><a href="#">Home</a></li>
            <li><a href="#">Legal Assistant</a></li>
            <li><a href="#">About Us</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Legal</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Disclaimer</a></li>
            <li><a href="#">Contact Support</a></li>
          </ul>
        </div>
      </div>
      
      <div style={{ maxWidth: "1000px", margin: "0 auto", borderTop: "1px solid #E5E7EB", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--text-muted)", flexWrap: "wrap", gap: "16px" }}>
        <p>© {new Date().getFullYear()} NyayaSetu. All rights reserved.</p>
        <p>Not a substitute for professional legal advice.</p>
      </div>
    </footer>
  );
}

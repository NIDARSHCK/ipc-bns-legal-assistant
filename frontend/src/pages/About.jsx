import React from "react";
import { Gavel, Scale, ShieldCheck } from "lucide-react";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div className="main-content">
      <div className="about-container">
        <div className="about-header">
          <h1>Built for the Legal Future</h1>
          <p>Navigating the transition from the Indian Penal Code (IPC) to the Bharatiya Nyaya Sanhita (BNS) made simple.</p>
        </div>
        
        <div className="about-section">
          <h2><Scale size={24} /> Our Mission</h2>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            NyayaSetu is dedicated to helping lawyers, students, researchers, and citizens easily understand the transition from IPC to BNS using AI-assisted legal research. Our goal is to bridge the gap between historic legal frameworks and modern provisions with speed, context, and accuracy.
          </p>
        </div>

        <div className="about-section">
          <h2><Gavel size={24} /> Who Can Use NyayaSetu</h2>
          <div className="about-grid">
            <div className="about-card">
              <h3>Law Professionals</h3>
              <p>Lawyers, advocates, and judges transitioning cases to the new BNS framework.</p>
            </div>
            <div className="about-card">
              <h3>Academia</h3>
              <p>Law students and researchers studying comparative criminal law.</p>
            </div>
            <div className="about-card">
              <h3>Public Servants</h3>
              <p>Police personnel and judiciary aspirants requiring quick provision lookups.</p>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2><ShieldCheck size={24} /> What Makes NyayaSetu Different</h2>
          <ul style={{ listStyle: "none", display: "grid", gap: "12px", color: "var(--text-secondary)" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Scale size={16} color="var(--accent-gold)"/> AI-assisted legal search</li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Scale size={16} color="var(--accent-gold)"/> IPC ↔ BNS comparative analysis</li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Scale size={16} color="var(--accent-gold)"/> Context-aware legal responses</li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Scale size={16} color="var(--accent-gold)"/> Source-based, hallucination-resistant answers</li>
          </ul>
        </div>
        
        <div style={{ marginTop: "64px", padding: "24px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--text-secondary)" }}>
          <strong>Disclaimer:</strong> NyayaSetu provides legal information for educational and research purposes only and should not be considered legal advice. Always consult a qualified advocate before taking any legal action.
        </div>
      </div>
      <Footer />
    </div>
  );
}

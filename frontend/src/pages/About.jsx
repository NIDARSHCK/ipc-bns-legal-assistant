import React from "react";
import { Gavel, Scale, ShieldCheck, Target, Eye, Zap, Search } from "lucide-react";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div className="main-content">
      <section className="about-hero animate-fade-in">
        <div className="about-bg"></div>
        <div className="about-hero-content">
          <h1>Built for the Legal Future</h1>
          <p style={{ fontSize: "22px", color: "rgba(255,255,255,0.9)", maxWidth: "800px", margin: "0 auto" }}>
            Navigating the transition from the Indian Penal Code (IPC) to the Bharatiya Nyaya Sanhita (BNS) with AI precision.
          </p>
        </div>
      </section>

      <section className="about-section animate-slide-up">
        <h2><Target size={32} color="var(--accent-gold)" /> Our Mission</h2>
        <div className="premium-card" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", padding: "40px" }}>
          <p style={{ fontSize: "18px", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            NyayaSetu is dedicated to helping lawyers, students, researchers, and citizens easily understand the transition from IPC to BNS using AI-assisted legal research. Our goal is to bridge the gap between historic legal frameworks and modern provisions with speed, context, and accuracy.
          </p>
        </div>
      </section>

      <section className="about-section animate-slide-up-delay">
        <h2><Eye size={32} color="var(--accent-gold)" /> Our Vision</h2>
        <div className="premium-card" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", padding: "40px" }}>
          <p style={{ fontSize: "18px", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            To become the most trusted and efficient digital legal assistant in India, empowering legal professionals to adapt to statutory changes instantly without the fear of hallucinated or incorrect citations.
          </p>
        </div>
      </section>

      <div style={{ height: '300px', background: 'linear-gradient(to bottom, rgba(15,15,15,0.7) 0%, rgba(15,15,15,0.9) 100%), url(https://images.unsplash.com/photo-1589391886645-154fa67876a4?q=80&w=2400) center/cover fixed', marginBottom: '80px' }}></div>

      <section className="about-section">
        <h2><Gavel size={32} color="var(--accent-gold)" /> Who We Serve</h2>
        <div className="grid-3">
          <div className="premium-card">
            <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>Law Professionals</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Lawyers, advocates, and judges transitioning cases to the new BNS framework efficiently.</p>
          </div>
          <div className="premium-card">
            <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>Academia</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Law students and researchers studying comparative criminal law and penal shifts.</p>
          </div>
          <div className="premium-card">
            <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>Public Servants</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Police personnel and judiciary aspirants requiring quick provision lookups on the field.</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2><ShieldCheck size={32} color="var(--accent-gold)" /> What Makes NyayaSetu Different</h2>
        <div className="grid-3">
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div className="icon-box"><Zap size={28} /></div>
            <h3>AI-Assisted Search</h3>
            <p>State-of-the-art retrieval mechanisms.</p>
          </div>
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div className="icon-box"><Scale size={28} /></div>
            <h3>Direct Comparisons</h3>
            <p>Side-by-side IPC and BNS mappings.</p>
          </div>
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div className="icon-box"><Search size={28} /></div>
            <h3>Context-Aware</h3>
            <p>Analyzes the exact incident date to route effectively.</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="premium-card" style={{ background: "var(--bg-tertiary)", borderColor: "transparent", textAlign: "center" }}>
          <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Legal Disclaimer</h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "800px", margin: "0 auto" }}>
            NyayaSetu provides legal information for educational and research purposes only and should not be considered legal advice. The AI-generated responses are based on the embedded legal corpus and may occasionally contain inaccuracies. Always consult a qualified advocate before taking any legal action.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

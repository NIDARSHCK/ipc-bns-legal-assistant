import React, { useRef } from "react";
import { ArrowRight, Scale, ShieldCheck, Zap, Library, Users, Search, BookOpen, BookKey, Gavel, ChevronDown } from "lucide-react";
import Footer from "../components/Footer";

export default function Home({ onStart }) {
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="main-content">
      {/* Hero Section */}
      <section className="hero-wrapper">
        <div className="hero-bg"></div>
        <div className="hero-logo-lockup animate-scale-up">
          <Scale size={120} />
          <h1>NyayaSetu</h1>
        </div>
        
        <div className="scroll-indicator animate-bounce" onClick={scrollToFeatures} style={{ position: "absolute", bottom: "40px" }}>
          <span>Scroll to Explore</span>
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="section-padding" style={{ background: "var(--bg-primary)" }}>
        <h2 className="section-title">Why Choose NyayaSetu</h2>
        <div className="grid-3">
          <div className="premium-card">
            <div className="icon-box"><Zap size={24} /></div>
            <h3>AI Legal Research</h3>
            <p>Accelerate your research with instantaneous, context-aware answers to complex legal queries.</p>
          </div>
          <div className="premium-card">
            <div className="icon-box"><Scale size={24} /></div>
            <h3>IPC ↔ BNS Comparison</h3>
            <p>Automatically map historical IPC sections to their exact Bharatiya Nyaya Sanhita equivalents.</p>
          </div>
          <div className="premium-card">
            <div className="icon-box"><Library size={24} /></div>
            <h3>Source-backed Responses</h3>
            <p>Every answer is grounded in exact statutory language with page citations to prevent hallucination.</p>
          </div>
          <div className="premium-card">
            <div className="icon-box"><ShieldCheck size={24} /></div>
            <h3>Secure Chat History</h3>
            <p>Log in securely to save, review, and organize your past legal conversations automatically.</p>
          </div>
          <div className="premium-card">
            <div className="icon-box"><Search size={24} /></div>
            <h3>Fast Legal Search</h3>
            <p>Query vast amounts of penal data in milliseconds using state-of-the-art vector similarity search.</p>
          </div>
          <div className="premium-card">
            <div className="icon-box"><BookOpen size={24} /></div>
            <h3>Context-aware Assistance</h3>
            <p>Responses automatically adjust based on the specified incident date to apply the correct legal framework.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <h4>511+</h4>
            <p>IPC Sections Mapped</p>
          </div>
          <div className="stat-card">
            <h4>358+</h4>
            <p>BNS Sections Indexed</p>
          </div>
          <div className="stat-card">
            <h4>99%</h4>
            <p>Mapping Accuracy</p>
          </div>
          <div className="stat-card">
            <h4>24/7</h4>
            <p>AI Availability</p>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="section-padding" style={{ background: "var(--bg-primary)" }}>
        <h2 className="section-title">Who Can Use It</h2>
        <div className="grid-3">
          <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div className="icon-box" style={{ marginBottom: 0, width: '48px', height: '48px' }}><Scale size={20} /></div>
            <div>
              <h3 style={{ marginBottom: '4px', fontSize: '18px' }}>Lawyers</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Transition cases seamlessly.</p>
            </div>
          </div>
          <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div className="icon-box" style={{ marginBottom: 0, width: '48px', height: '48px' }}><BookKey size={20} /></div>
            <div>
              <h3 style={{ marginBottom: '4px', fontSize: '18px' }}>Law Students</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Study comparative law.</p>
            </div>
          </div>
          <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div className="icon-box" style={{ marginBottom: 0, width: '48px', height: '48px' }}><ShieldCheck size={20} /></div>
            <div>
              <h3 style={{ marginBottom: '4px', fontSize: '18px' }}>Police Officers</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Quick statutory lookups.</p>
            </div>
          </div>
          <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div className="icon-box" style={{ marginBottom: 0, width: '48px', height: '48px' }}><Gavel size={20} /></div>
            <div>
              <h3 style={{ marginBottom: '4px', fontSize: '18px' }}>Judiciary Aspirants</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Prepare for exams.</p>
            </div>
          </div>
          <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div className="icon-box" style={{ marginBottom: 0, width: '48px', height: '48px' }}><Library size={20} /></div>
            <div>
              <h3 style={{ marginBottom: '4px', fontSize: '18px' }}>Researchers</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Analyze penal shifts.</p>
            </div>
          </div>
          <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div className="icon-box" style={{ marginBottom: 0, width: '48px', height: '48px' }}><Users size={20} /></div>
            <div>
              <h3 style={{ marginBottom: '4px', fontSize: '18px' }}>Citizens</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Understand legal rights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-bg"></div>
        <div className="cta-content">
          <h2>Ready to upgrade your legal research?</h2>
          <p style={{ fontSize: '20px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Join professionals across India adapting to the BNS seamlessly.
          </p>
          <button className="btn btn-primary" onClick={onStart} style={{ padding: '16px 32px', fontSize: '16px' }}>
            Start Using NyayaSetu Now
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

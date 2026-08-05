import React from "react";
import { ArrowRight } from "lucide-react";
import Footer from "../components/Footer";

export default function Home({ onStart }) {
  return (
    <section className="hero-wrapper">
      <div className="hero-bg"></div>
      <div className="hero-content">
        <h1>Navigate India's Criminal Law Transition with Confidence</h1>
        <p>Compare IPC and BNS provisions instantly using an AI-powered legal research assistant.</p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={onStart}>
            Start Legal Research <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <Footer />
    </section>
  );
}

import React, { useRef, useEffect } from "react";
import { Send, Scale, Loader2, CalendarDays } from "lucide-react";

export default function Chat({
  legalEra,
  incidentDateText,
  setIncidentDateText,
  question,
  setQuestion,
  handleAsk,
  loading,
  result,
  error
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [question]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk(e);
    }
  };

  const setPrompt = (text) => {
    setQuestion(text);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-title">
          <Scale size={20} color="var(--accent-gold)" /> NyayaSetu AI
        </div>
        <div className="input-pill" style={{ background: "white", border: "1px solid #E5E7EB" }}>
          <CalendarDays size={14} />
          <input 
            value={incidentDateText} 
            onChange={(e) => setIncidentDateText(e.target.value)} 
            placeholder="YYYY-MM-DD"
          />
          <span style={{ color: "var(--accent-gold)", fontSize: "12px", marginLeft: "8px" }}>{legalEra}</span>
        </div>
      </div>

      <div className="chat-messages">
        {!result && !error && !loading && (
          <div className="empty-state">
            <div className="empty-icon"><Scale size={32} /></div>
            <h2>How can I assist your legal research today?</h2>
            <p>I can help compare IPC and BNS provisions, search punishments, and explain legal transition nuances.</p>
            
            <div className="suggested-prompts">
              <button className="prompt-card" onClick={() => setPrompt("Compare IPC Section 420 with BNS")}>
                <h3>Compare IPC Section 420</h3>
                <p>Find the exact BNS equivalent and notes.</p>
              </button>
              <button className="prompt-card" onClick={() => setPrompt("Search punishment for theft")}>
                <h3>Punishment for theft</h3>
                <p>Explain the latest BNS provisions.</p>
              </button>
              <button className="prompt-card" onClick={() => setPrompt("Explain IPC Section 302")}>
                <h3>Explain IPC Section 302</h3>
                <p>View the murder definitions and mappings.</p>
              </button>
              <button className="prompt-card" onClick={() => setPrompt("What is the penalty for kidnapping a minor?")}>
                <h3>Kidnapping a minor</h3>
                <p>Search the transition rules for this offence.</p>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="message-wrapper">
            <div className="auth-error" style={{ marginBottom: 0 }}>{error}</div>
          </div>
        )}

        {result && (
          <div className="message-wrapper">
            <div className="message message-user">
              <div className="message-header">
                <div className="avatar avatar-user">U</div>
                User Request
              </div>
              <div className="message-content">{result.question_asked || "Prior query loaded."}</div>
            </div>

            <div className="message message-ai">
              <div className="message-header">
                <div className="avatar avatar-ai"><Scale size={14}/></div>
                NyayaSetu Assistant
              </div>
              <div className="message-content">{result.answer}</div>
              
              {result.citations && result.citations.length > 0 && (
                <div className="citations-box">
                  <h4><BookOpen size={16} /> Source Citations</h4>
                  {result.citations.map((c, i) => (
                    <div className="citation-card" key={i}>
                      <strong>{c.act} Section {c.section}: {c.title}</strong>
                      <span>Relevance Score: {Number(c.score || 0).toFixed(3)} | Page: {c.page}</span>
                      <p>{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="message-wrapper">
            <div className="message message-ai" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Loader2 className="spin" size={20} color="var(--accent-gold)" />
              <span style={{ color: "var(--text-secondary)" }}>Analyzing legal corpus...</span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-wrapper">
        <form className="chat-input-container" onSubmit={handleAsk}>
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about a section, offence, punishment, or transition..."
            rows={1}
          />
          <div className="chat-send-row">
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Press Shift + Enter for new line
            </div>
            <button className="send-btn" type="submit" disabled={loading || !question.trim()}>
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Importing missing icon locally within the file to avoid broken imports
import { BookOpen } from "lucide-react";

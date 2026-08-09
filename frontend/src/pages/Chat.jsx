import React, { useRef, useEffect } from "react";
import { Send, Scale, BookOpen, Paperclip, ChevronDown, RefreshCw, Zap, ShieldCheck } from "lucide-react";

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
      textareaRef.current.style.height = "auto";
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
    <div className="chat-container chat-workspace">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-header-title">
            <Scale size={24} color="var(--accent-gold)" /> NyayaSetu Legal AI
          </div>
          <div className="chat-header-subtitle">
            AI-powered IPC ↔ BNS Legal Research Assistant
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div className="chat-filter-btn" title="Set Incident Date">
            <span>Date: {incidentDateText || "Any"}</span>
            <span style={{ color: "var(--accent-gold)" }}>({legalEra})</span>
            <ChevronDown size={14} />
          </div>
          {/* A mock hidden input layer on top of the button for easy date entry without building a complex dropdown component right now */}
          <input 
            type="date"
            value={incidentDateText}
            onChange={(e) => setIncidentDateText(e.target.value)}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
          />
        </div>
      </div>

      <div className="chat-messages">
        {!result && !error && !loading && (
          <div className="welcome-section animate-slide-up">
            <h2>Welcome back.</h2>
            <p>Start researching Indian criminal law with AI assistance. Search IPC sections, compare BNS provisions, understand punishments, or explore legal transitions.</p>
            
            <div className="suggested-prompts" style={{ marginTop: '40px' }}>
              <button className="prompt-card" onClick={() => setPrompt("Compare IPC Section 420 with BNS")}>
                <div className="icon-box"><RefreshCw size={20} /></div>
                <div>
                  <h3>Compare IPC Section 420</h3>
                  <p>Find equivalent BNS provision.</p>
                </div>
              </button>
              <button className="prompt-card" onClick={() => setPrompt("Explain IPC Section 302")}>
                <div className="icon-box"><BookOpen size={20} /></div>
                <div>
                  <h3>Explain IPC Section 302</h3>
                  <p>Murder law transition.</p>
                </div>
              </button>
              <button className="prompt-card" onClick={() => setPrompt("What is the penalty for cybercrime under BNS?")}>
                <div className="icon-box"><Zap size={20} /></div>
                <div>
                  <h3>Cybercrime under BNS</h3>
                  <p>Search latest provisions.</p>
                </div>
              </button>
              <button className="prompt-card" onClick={() => setPrompt("What is the updated punishment for Theft?")}>
                <div className="icon-box"><ShieldCheck size={20} /></div>
                <div>
                  <h3>Punishment for Theft</h3>
                  <p>Find updated punishment.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="message-row">
            <div className="auth-error" style={{ marginBottom: 0 }}>{error}</div>
          </div>
        )}

        {result && (
          <>
            <div className="message-row message-row-user animate-slide-up">
              <div className="message-bubble message-bubble-user">
                {result.question_asked || "Prior query loaded."}
              </div>
            </div>

            <div className="message-row animate-slide-up-delay">
              <div className="message-bubble message-bubble-ai">
                <div className="message-ai-header">
                  <div className="avatar-ai"><Scale size={16}/></div>
                  NyayaSetu
                </div>
                
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {typeof result.answer === 'string' ? result.answer : (
                    typeof result.answer === 'object' && result.answer !== null ? (
                      <div className="structured-answer" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {Object.entries(result.answer).map(([key, value]) => (
                          <div key={key}>
                            <h3 style={{ color: "var(--accent-gold)", marginBottom: "6px", fontSize: "16px", textTransform: "capitalize", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
                              {key.replace(/_/g, ' ')}
                            </h3>
                            <div style={{ paddingLeft: "8px", borderLeft: "2px solid var(--accent-gold)", color: "var(--text-primary)" }}>
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : "Invalid response format received."
                  )}
                </div>
                
                {result.comparison && (
                  <div className="comparison-panel" style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", gap: "16px" }}>
                    <div className="comp-box" style={{ flex: "1 1 250px", background: "var(--bg-secondary)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <h4 style={{ color: "var(--accent-gold)", marginBottom: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>IPC Section {result.comparison.ipc?.section || "N/A"}</h4>
                      <p><strong>Offence:</strong> {result.comparison.ipc?.offence || "N/A"}</p>
                      {result.comparison.ipc?.punishment && <p><strong>Punishment:</strong> {result.comparison.ipc.punishment}</p>}
                    </div>
                    <div className="comp-box" style={{ flex: "1 1 250px", background: "var(--bg-secondary)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <h4 style={{ color: "var(--accent-gold)", marginBottom: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>BNS Section {result.comparison.bns?.section || "N/A"}</h4>
                      <p><strong>Offence:</strong> {result.comparison.bns?.offence || "N/A"}</p>
                      {result.comparison.bns?.punishment && <p><strong>Punishment:</strong> {result.comparison.bns.punishment}</p>}
                    </div>
                  </div>
                )}
                
                {result.citations && result.citations.length > 0 && (
                  <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border-color)" }}>
                    <h4 style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      <BookOpen size={14} /> Source Citations
                    </h4>
                    <div style={{ display: "grid", gap: "12px" }}>
                      {result.citations.map((c, i) => (
                        <div key={i} style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                          <strong style={{ display: "block", fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>
                            {c.act} Section {c.section}: {c.title}
                          </strong>
                          <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
                            {c.page && c.page !== "unknown" ? `Source page: ${c.page}` : ""} 
                            {c.year ? ` • Year: ${c.year}` : ""}
                            {c.score ? ` • Relevance: ${(c.score * 100).toFixed(1)}%` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.disclaimer && (
                  <div style={{ marginTop: "24px", padding: "16px", background: "rgba(255, 193, 7, 0.1)", borderRadius: "8px", border: "1px solid rgba(255, 193, 7, 0.3)", color: "var(--text-secondary)", fontSize: "12px" }}>
                    <strong>Disclaimer:</strong> {result.disclaimer}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="message-row animate-slide-up">
            <div className="message-bubble message-bubble-ai" style={{ maxWidth: "200px" }}>
              <div className="typing-indicator">
                <Scale size={16} color="var(--accent-gold)" />
                <div className="dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-wrapper">
        <form className="chat-input-container" onSubmit={handleAsk}>
          <div className="chat-input-top">
            <button type="button" className="attach-btn">
              <Paperclip size={20} />
            </button>
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about IPC, BNS, punishments, legal provisions, or criminal law..."
              rows={1}
            />
            <button className="send-btn" type="submit" disabled={loading || !question.trim()}>
              <Send size={20} />
            </button>
          </div>
          <div className="chat-input-bottom">
            <span className="chat-hint">NyayaSetu can make mistakes. Check important info. (Press Shift + Enter for new line)</span>
          </div>
        </form>
      </div>
    </div>
  );
}

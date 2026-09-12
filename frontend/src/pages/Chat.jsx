import React, { useRef, useEffect } from "react";
import { Send, Scale, BookOpen, Paperclip, ChevronDown, RefreshCw, Zap, ShieldCheck, Info, FileText, ArrowRightLeft, CheckCircle2 } from "lucide-react";

function renderStructuredAnswer(ans) {
  if (!ans || typeof ans !== "object") {
    return <div>{String(ans || "")}</div>;
  }

  const isFallback = ans.direct_answer && (
    ans.direct_answer.includes("couldn't find a sufficiently relevant source") ||
    ans.direct_answer.includes("only assist with Indian criminal law questions")
  );

  if (isFallback) {
    return (
      <div style={{ padding: "16px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <Info size={20} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <h4 style={{ margin: "0 0 6px 0", color: "var(--text-primary)", fontSize: "15px", fontWeight: 600 }}>Legal Advisory</h4>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5 }}>
            {ans.direct_answer}
          </p>
        </div>
      </div>
    );
  }

  const fieldConfigs = [
    { key: "what_it_means", label: "What It Means" },
    { key: "important_elements", label: "Important Legal Elements" },
    { key: "punishment", label: "Prescribed Punishment" },
    { key: "clauses", label: "Clauses & Subsections" },
    { key: "exceptions_or_provisos", label: "Exceptions & Provisos" },
    { key: "practical_example", label: "Practical Example", isExample: true },
    { key: "how_it_relates", label: "How It Relates" },
    { key: "important_notes", label: "Important Notes" },
    { key: "related_provisions", label: "Related Provisions" },
  ];

  return (
    <div className="structured-answer" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {ans.direct_answer && (
        <div style={{ padding: "14px 16px", background: "var(--accent-gold-light)", borderRadius: "8px", borderLeft: "4px solid var(--accent-gold)" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--accent-gold)", marginBottom: "4px" }}>
            Direct Answer
          </div>
          <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.5 }}>
            {ans.direct_answer}
          </div>
        </div>
      )}

      {ans.relevant_law && ans.relevant_law !== "N/A" && (
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--bg-tertiary)", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "var(--accent-gold)" }}>
            <BookOpen size={14} /> {ans.relevant_law}
          </div>
        </div>
      )}

      {fieldConfigs.map(({ key, label, isExample }) => {
        const val = ans[key];
        if (!val || val === "null" || val === "None" || val === "N/A" || (typeof val === "object" && Object.keys(val).length === 0)) {
          return null;
        }

        if (isExample) {
          return (
            <div key={key} style={{ padding: "14px 16px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px dashed var(--accent-gold)" }}>
              <h4 style={{ color: "var(--accent-gold)", marginBottom: "6px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={15} /> {label}
              </h4>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6 }}>
                {typeof val === "string" ? val : JSON.stringify(val)}
              </p>
            </div>
          );
        }

        return (
          <div key={key}>
            <h3 style={{ color: "var(--accent-gold)", marginBottom: "6px", fontSize: "15px", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
              {label}
            </h3>
            <div style={{ paddingLeft: "8px", borderLeft: "2px solid var(--accent-gold)", color: "var(--text-primary)", fontSize: "14px", lineHeight: 1.6 }}>
              {typeof val === "object" && val !== null ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {Object.entries(val).map(([subKey, subVal]) => (
                    <div key={subKey} style={{ background: "var(--bg-secondary)", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                      <strong style={{ color: "var(--accent-gold)" }}>{subKey}:</strong> {String(subVal)}
                    </div>
                  ))}
                </div>
              ) : (
                String(val)
              )}
            </div>
          </div>
        );
      })}

      {Object.entries(ans).map(([key, val]) => {
        if (["direct_answer", "relevant_law", "what_it_means", "important_elements", "punishment", "clauses", "exceptions_or_provisos", "practical_example", "how_it_relates", "important_notes", "related_provisions", "section_mapping"].includes(key)) {
          return null;
        }
        if (!val || val === "null" || val === "None" || val === "N/A") return null;
        return (
          <div key={key}>
            <h3 style={{ color: "var(--accent-gold)", marginBottom: "6px", fontSize: "15px", textTransform: "capitalize", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
              {key.replace(/_/g, " ")}
            </h3>
            <div style={{ paddingLeft: "8px", borderLeft: "2px solid var(--accent-gold)", color: "var(--text-primary)", fontSize: "14px", lineHeight: 1.6 }}>
              {typeof val === "object" ? JSON.stringify(val) : String(val)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderComparison(comp) {
  if (!comp) return null;

  const sourceAct = (comp.source_act || "").toUpperCase();
  const targetAct = (comp.target_act || "").toUpperCase();

  let ipc = comp.ipc;
  if (!ipc) {
    if (sourceAct === "IPC" && comp.source) {
      ipc = comp.source;
    } else if (targetAct === "IPC" && comp.target) {
      ipc = comp.target;
    }
  }

  let bns = comp.bns;
  if (!bns) {
    if (sourceAct === "BNS" && comp.source) {
      bns = comp.source;
    } else if (targetAct === "BNS" && comp.target) {
      bns = comp.target;
    }
  }

  ipc = ipc || {};
  bns = bns || {};

  const tableRows = [
    { label: "Section", ipc: ipc.section ? `IPC Section ${ipc.section}` : "N/A", bns: bns.section ? `BNS Section ${bns.section}` : "N/A" },
    { label: "Provision / Offence", ipc: ipc.offence || "N/A", bns: bns.offence || "N/A" },
    { label: "Purpose", ipc: ipc.purpose || "N/A", bns: bns.purpose || "N/A" },
    { label: "Punishment", ipc: ipc.punishment || "N/A", bns: bns.punishment || "N/A" },
    { label: "Clauses / Subsections", ipc: ipc.clauses || "None", bns: bns.clauses || "None" },
    { label: "Exceptions", ipc: ipc.exceptions || "None", bns: bns.exceptions || "None" },
  ];

  return (
    <div className="comparison-panel" style={{ marginTop: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h3 style={{ color: "var(--accent-gold)", margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <ArrowRightLeft size={18} /> Legal Comparison: IPC ↔ BNS
        </h3>
        {comp.relationship && (
          <span style={{ background: "var(--accent-gold-light)", color: "var(--accent-gold)", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, border: "1px solid var(--accent-gold)" }}>
            {comp.relationship}
          </span>
        )}
      </div>

      {comp.summary && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "14px", lineHeight: 1.6, borderLeft: "3px solid var(--accent-gold)" }}>
          <strong>Summary: </strong> {comp.summary}
        </div>
      )}

      {/* Comparison Table */}
      <div style={{ overflowX: "auto", marginBottom: "20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
          <thead>
            <tr style={{ background: "var(--bg-tertiary)", borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
              <th style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-primary)", width: "22%" }}>Item</th>
              <th style={{ padding: "10px 14px", fontWeight: 700, color: "var(--accent-gold)", width: "39%" }}>Indian Penal Code (IPC)</th>
              <th style={{ padding: "10px 14px", fontWeight: 700, color: "var(--accent-gold)", width: "39%" }}>Bharatiya Nyaya Sanhita (BNS)</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? "var(--card-bg)" : "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-primary)" }}>{row.label}</td>
                <td style={{ padding: "10px 14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{row.ipc}</td>
                <td style={{ padding: "10px 14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{row.bns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Transition Insights */}
      <div style={{ display: "grid", gap: "12px" }}>
        {comp.what_stayed_the_same && (
          <div style={{ padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ color: "var(--accent-gold)", margin: "0 0 6px 0", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={14} /> What Stayed the Same
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>
              {comp.what_stayed_the_same}
            </p>
          </div>
        )}

        {comp.what_changed && (
          <div style={{ padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ color: "var(--accent-gold)", margin: "0 0 6px 0", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
              <RefreshCw size={14} /> What Changed
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>
              {comp.what_changed}
            </p>
          </div>
        )}

        {comp.practical_significance && (
          <div style={{ padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ color: "var(--accent-gold)", margin: "0 0 6px 0", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
              <Zap size={14} /> Practical Significance
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>
              {comp.practical_significance}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


export default function Chat({
  legalEra,
  incidentDateText,
  setIncidentDateText,
  question,
  setQuestion,
  handleAsk,
  loading,
  messages,
  error,
  handleNewChat
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={handleNewChat}
            className="btn btn-outline" 
            style={{ padding: '6px 12px', fontSize: '13px', height: '32px' }}
          >
            + New Chat
          </button>
          <div style={{ position: 'relative' }}>
            <div className="chat-filter-btn" title="Set Incident Date">
              <span>Date: {incidentDateText || "Any"}</span>
              <span style={{ color: "var(--accent-gold)" }}>({legalEra})</span>
              <ChevronDown size={14} />
            </div>
            <input 
              type="date"
              value={incidentDateText}
              onChange={(e) => setIncidentDateText(e.target.value)}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !error && !loading && (
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

        {messages.map((msg, index) => {
          if (msg.role === "user") {
            return (
              <div key={index} className="message-row message-row-user animate-slide-up">
                <div className="message-bubble message-bubble-user">
                  {msg.content}
                </div>
              </div>
            );
          } else {
            const raw = msg.raw || {};
            return (
              <div key={index} className="message-row animate-slide-up-delay">
                <div className="message-bubble message-bubble-ai">
                  <div className="message-ai-header">
                    <div className="avatar-ai"><Scale size={16}/></div>
                    NyayaSetu
                  </div>
                  
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {typeof msg.content === 'string' ? msg.content : (
                      typeof msg.content === 'object' && msg.content !== null ? (
                        renderStructuredAnswer(msg.content)
                      ) : "Invalid response format received."
                    )}
                  </div>
                  
                  {raw.comparison && renderComparison(raw.comparison)}

                  {raw.answer && raw.answer.section_mapping && (
                    <div style={{ marginTop: "24px", padding: "16px", background: "rgba(33, 150, 243, 0.05)", borderRadius: "8px", border: "1px solid rgba(33, 150, 243, 0.2)" }}>
                      <h4 style={{ color: "#2196f3", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <RefreshCw size={16} /> Section Mapping Details
                      </h4>
                      <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6 }}>
                        {raw.answer.section_mapping}
                      </p>
                    </div>
                  )}
                  
                  {raw.citations && raw.citations.length > 0 && (
                    <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border-color)" }}>
                      <h4 style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <BookOpen size={14} /> Source Citations
                      </h4>
                      <div style={{ display: "grid", gap: "12px" }}>
                        {raw.citations.map((c, i) => (
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
                  
                  {raw.disclaimer && (
                    <div style={{ marginTop: "24px", padding: "16px", background: "rgba(255, 193, 7, 0.1)", borderRadius: "8px", border: "1px solid rgba(255, 193, 7, 0.3)", color: "var(--text-secondary)", fontSize: "12px" }}>
                      <strong>Disclaimer:</strong> {raw.disclaimer}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        })}

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

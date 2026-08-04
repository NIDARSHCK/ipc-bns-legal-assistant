import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Gavel,
  History,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";

import {
  askLegalAssistant,
  fetchCurrentUser,
  fetchHistory,
  fetchMappings,
} from "./services/api";
import { supabase } from "./services/supabase";

const transitionDate = "2024-07-01";

function parseIncidentDate(value) {
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return { date: text };

  const monthYear = text.match(
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})$/i
  );
  if (monthYear) return { ambiguous: true, label: text };

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return { date: parsed.toISOString().slice(0, 10) };
  return { error: "Enter a complete date like 2023-07-14 or 14 July 2023." };
}

export default function App() {
  const [activeView, setActiveView] = useState("login");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [question, setQuestion] = useState("What is the BNS equivalent of IPC 420 cheating?");
  const [incidentDateText, setIncidentDateText] = useState("2024-07-02");
  const [forcedEra, setForcedEra] = useState(null);
  const [clarifyDate, setClarifyDate] = useState(null);
  const [showTransitionPopup, setShowTransitionPopup] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const parsedDate = useMemo(() => parseIncidentDate(incidentDateText), [incidentDateText]);
  const legalEra = parsedDate.date && parsedDate.date >= transitionDate ? "BNS" : parsedDate.date ? "IPC" : "Needs date";
  const isSignedIn = Boolean(session?.access_token);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setProfile(null);
      setHistory([]);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.access_token) return;
    refreshSessionData(session.access_token);
  }, [session?.access_token]);

  async function refreshSessionData(accessToken) {
    try {
      const [userProfile, userHistory] = await Promise.all([
        fetchCurrentUser(accessToken),
        fetchHistory(accessToken),
      ]);
      setProfile(userProfile);
      setHistory(userHistory);
    } catch (err) {
      setToast(err.message);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    if (!supabase) {
      setAuthMessage("Supabase keys are not configured. Use demo mode for local testing.");
      return;
    }
    setAuthMessage("");
    const action =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error: authError } = await action;
    if (authError) setAuthMessage(authError.message);
    if (!authError && mode === "signup") setAuthMessage("Account created. Confirm email if Supabase asks.");
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setHistory([]);
    setActiveView("login");
  }

  async function submitQuestion(dateOverride, eraOverride) {
    const incidentDate = dateOverride || parsedDate.date;
    const era = eraOverride || forcedEra;
    if (!incidentDate) return;

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const answer = await askLegalAssistant({
        question,
        incidentDate,
        forcedEra: era,
        accessToken: session?.access_token,
      });
      setResult(answer);
      setQuestion("");
      await refreshSessionData(session.access_token);
      setToast("Answer generated and saved to history.");
    } catch (err) {
      setError(err.message);
      setToast(err.message);
    } finally {
      setLoading(false);
      setForcedEra(null);
    }
  }

  function handleAsk(event) {
    event.preventDefault();
    if (!isSignedIn) {
      setToast("Sign in before asking a question.");
      setActiveView("login");
      return;
    }
    if (!question.trim()) return setError("Ask a legal question before sending.");
    if (parsedDate.ambiguous) return setClarifyDate(parsedDate.label);
    if (parsedDate.error) return setError(parsedDate.error);
    if (parsedDate.date === transitionDate && !forcedEra) return setShowTransitionPopup(true);
    submitQuestion();
  }

  function openHistoryItem(item) {
    setResult({
      answer: item.answer,
      legal_era: item.legal_era,
      namespace: item.legal_era?.toLowerCase(),
      citations: item.citations || [],
      history_id: item.id,
    });
    setActiveView("chat");
  }

  const navItems = [
    ["home", "Home"],
    ["chat", "Chat"],
    ["about", "About Us"],
    ["history", "Chat History"],
  ];

  return (
    <main>
      <header className="topbar">
        <button className="brand-lockup" onClick={() => setActiveView("home")}>
          <span className="brand-mark"><Scale size={24} /></span>
          <span><strong>NyayaSetu</strong><small>IPC to BNS legal transition</small></span>
        </button>

        <button className="menu-button" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <nav className={mobileOpen ? "nav-links open" : "nav-links"}>
          {navItems.map(([id, label]) => (
            <button key={id} className={activeView === id ? "active" : ""} onClick={() => { setActiveView(id); setMobileOpen(false); }}>
              {label}
            </button>
          ))}
          {isSignedIn ? (
            <button className="nav-auth" onClick={handleSignOut}><LogOut size={16} /> Sign out</button>
          ) : (
            <button className="nav-auth" onClick={() => setActiveView("login")}><LogIn size={16} /> Sign Up / Login</button>
          )}
        </nav>
      </header>

      {activeView === "home" && <Landing onStart={() => setActiveView(isSignedIn ? "chat" : "login")} />}
      {activeView === "about" && <About />}
      {activeView === "login" && <AuthPanel mode={mode} setMode={setMode} email={email} setEmail={setEmail} password={password} setPassword={setPassword} handleAuth={handleAuth} authMessage={authMessage} />}
      {activeView === "chat" && <ChatView legalEra={legalEra} incidentDateText={incidentDateText} setIncidentDateText={setIncidentDateText} question={question} setQuestion={setQuestion} handleAsk={handleAsk} loading={loading} result={result} error={error} signedIn={isSignedIn} onLogin={() => setActiveView("login")} />}
      {activeView === "history" && <HistoryList items={history} onOpen={openHistoryItem} signedIn={isSignedIn} onLogin={() => setActiveView("login")} />}

      {showTransitionPopup && (
        <Modal icon={<Scale size={24} />} title="Legal Transition Date Detected">
          <p>July 1, 2024 is the IPC to BNS transition date. Choose which legal framework should be used for this query.</p>
          <div className="modal-actions two">
            <button className="ghost-button" onClick={() => { setShowTransitionPopup(false); submitQuestion("2024-07-01", "IPC"); }}>Use IPC</button>
            <button className="primary-button" onClick={() => { setShowTransitionPopup(false); submitQuestion("2024-07-01", "BNS"); }}><Check size={17} />Use BNS</button>
          </div>
        </Modal>
      )}

      {clarifyDate && (
        <Modal icon={<CalendarDays size={24} />} title="Exact incident date needed">
          <p>Use Supabase credentials in production to safely store queries.</p>
          <div className="modal-actions">
            <button className="ghost-button" onClick={() => { setClarifyDate(null); setIncidentDateText("2024-06-30"); submitQuestion("2024-06-30"); }}>Before 1 July 2024</button>
            <button className="ghost-button" onClick={() => { setClarifyDate(null); setIncidentDateText("2024-07-01"); submitQuestion("2024-07-01"); }}>On/after 1 July 2024</button>
            <button className="primary-button" onClick={() => { setClarifyDate(null); setError("Please type the exact incident date, for example 2023-07-14."); }}><Check size={17} />Enter exact date</button>
          </div>
        </Modal>
      )}

      {toast && <button className="toast" onClick={() => setToast("")}>{toast}</button>}
    </main>
  );
}

function Landing({ onStart, onMap }) {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">Legal power of law, rebuilt for the IPC to BNS transition</span>
          <h1>IPC to BNS Legal Transition Assistant</h1>
          <p>Ask date-aware questions, retrieve grounded citations, and compare high-impact IPC provisions with their BNS equivalents in a polished legal-tech workspace.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={onStart}>Start legal chat <ArrowRight size={18} /></button>
          </div>
        </div>
      </section>
      <section className="feature-band">
        {[
          [<Sparkles size={22} />, "RAG chatbot", "Retrieves IPC/BNS context, routes by incident date, and returns source citations."],

          [<ShieldCheck size={22} />, "Production path", "Supabase auth/history, Pinecone vectors, env-based CORS, and deploy-ready APIs."],
        ].map(([icon, title, copy]) => (
          <article className="feature-card" key={title}>{icon}<h2>{title}</h2><p>{copy}</p></article>
        ))}
      </section>
    </>
  );
}

function AuthPanel(props) {
  return (
    <section className="auth-page">
      <div className="auth-copy">
        <span className="eyebrow">Secure workspace</span>
        <h1>Sign in for saved legal research history.</h1>
      </div>
      <form className="auth-card" onSubmit={props.handleAuth}>
        <h2>{props.mode === "signin" ? "Sign in" : "Create account"}</h2>
        <label>Email<input value={props.email} onChange={(event) => props.setEmail(event.target.value)} type="email" required /></label>
        <label>Password<input value={props.password} onChange={(event) => props.setPassword(event.target.value)} type="password" minLength={6} required /></label>
        <button className="primary-button" type="submit">{props.mode === "signin" ? <LogIn size={18} /> : <UserPlus size={18} />}{props.mode === "signin" ? "Sign in" : "Create account"}</button>

        <button className="link-button" type="button" onClick={() => props.setMode(props.mode === "signin" ? "signup" : "signin")}>{props.mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button>
        {props.authMessage && <p className="message">{props.authMessage}</p>}
      </form>
    </section>
  );
}

function ChatView({ legalEra, incidentDateText, setIncidentDateText, question, setQuestion, handleAsk, loading, result, error, signedIn, onLogin }) {
  return (
    <section className="workspace">
      <div className="section-heading">
        <span className="eyebrow">Date-aware retrieval</span>
        <h1>Chat with the IPC-BNS assistant</h1>
      </div>
      {!signedIn && <div className="notice"><AlertCircle size={20} /><p>Sign in to ask questions.</p><button className="ghost-button" onClick={onLogin}>Open login</button></div>}
      <div className="chat-grid">
        <form className="composer" onSubmit={handleAsk}>
          <div className={`era-pill ${legalEra.toLowerCase().replace(" ", "-")}`}><ShieldCheck size={18} />{legalEra}</div>
          <label><span><CalendarDays size={17} />Incident date</span><input value={incidentDateText} onChange={(event) => setIncidentDateText(event.target.value)} required /></label>
          <label><span><BookOpen size={17} />Legal question</span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={8} required /></label>
          <button className="primary-button" disabled={loading} type="submit">{loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}{loading ? "Searching sources..." : "Send question"}</button>
        </form>
        <section className="response-surface">
          {!result && !error && <div className="empty-state"><Search size={34} /><h2>Ask about a section, offence, punishment, or transition.</h2><p>Answers include the applicable legal era, citations, and mapped IPC/BNS references where available.</p></div>}
          {error && <div className="notice error"><AlertCircle size={20} /><p>{error}</p></div>}
          {result && <Answer result={result} />}
        </section>
      </div>
    </section>
  );
}

function Answer({ result }) {
  return (
    <article className="answer-panel">
      <div className="answer-meta"><span>{result.legal_era}</span><span>Namespace: {result.namespace}</span>{result.history_id && <span>Saved</span>}</div>
      <pre>{result.answer}</pre>
      <div className="citations">
        {(result.citations || []).map((citation) => (
          <article key={citation.id || `${citation.act}-${citation.section}`}>
            <strong>{citation.act} Section {citation.section}: {citation.title}</strong>
            <span>Score: {Number(citation.score || 0).toFixed(3)} | Source page: {citation.page}</span>
            <p>{citation.text}</p>
          </article>
        ))}
      </div>
    </article>
  );
}

function HistoryList({ items, onOpen, signedIn, onLogin }) {
  return (
    <section className="workspace narrow">
      <div className="section-heading"><span className="eyebrow">{items.length} saved queries</span><h1>Chat History</h1></div>
      {!signedIn && <div className="notice"><History size={20} /><p>Sign in to view chat history.</p><button className="ghost-button" onClick={onLogin}>Open login</button></div>}
      <div className="history-list">
        {signedIn && items.length === 0 && <p className="muted">No saved queries yet.</p>}
        {items.map((item) => (
          <button key={item.id} className="history-item" onClick={() => onOpen(item)}>
            <strong>{item.question}</strong>
            <span>{item.legal_era} | {item.incident_date} | {new Date(item.created_at).toLocaleString()}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="about-page">
      <div className="section-heading"><span className="eyebrow">About Us</span><h1>Built for advocates, students, and legal teams navigating India’s criminal law transition.</h1></div>
      <div className="about-grid">
        <article><Gavel size={26} /><h2>Purpose</h2><p>NyayaSetu explains whether IPC or BNS applies based on incident date, then anchors answers to retrieved legal text and curated mappings.</p></article>
        <article><ShieldCheck size={26} /><h2>Guardrails</h2><p>The assistant is designed for legal information, not legal advice. It refuses non-legal prompts and highlights source limitations.</p></article>
        <article><Scale size={26} /><h2>Architecture</h2><p>React, FastAPI, Supabase, Pinecone, and deploy-ready environment configuration keep the project aligned with production workflows.</p></article>
      </div>
    </section>
  );
}

function Modal({ icon, title, children }) {
  return (
    <div className="modal-backdrop">
      <section className="modal">
        <div className="modal-icon">{icon}</div>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Check,
  History,
  LayoutDashboard,
  LogIn,
  LogOut,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { askLegalAssistant, fetchAdminHistory, fetchCurrentUser, fetchHistory } from "./services/api";
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
  if (!Number.isNaN(parsed.getTime())) {
    return { date: parsed.toISOString().slice(0, 10) };
  }

  return { error: "Enter a complete date like 2023-07-14 or 14 July 2023." };
}

export default function App() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMessage, setAuthMessage] = useState("");

  const [question, setQuestion] = useState("");
  const [incidentDateText, setIncidentDateText] = useState("2024-07-02");
  const [clarifyDate, setClarifyDate] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [adminHistory, setAdminHistory] = useState([]);
  const [activeView, setActiveView] = useState("chat");

  const parsedDate = useMemo(() => parseIncidentDate(incidentDateText), [incidentDateText]);
  const legalEra = useMemo(() => {
    if (!parsedDate.date) return "Needs date";
    return parsedDate.date >= transitionDate ? "BNS" : "IPC";
  }, [parsedDate.date]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setProfile(null);
      setResult(null);
      setError("");
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
      if (userProfile.role === "admin") {
        setAdminHistory(await fetchAdminHistory(accessToken));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    if (!supabase) {
      setAuthMessage("Add Supabase frontend keys in frontend/.env first.");
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
    setAdminHistory([]);
  }

  async function submitQuestion(dateOverride) {
    const incidentDate = dateOverride || parsedDate.date;
    if (!incidentDate) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const answer = await askLegalAssistant({
        question,
        incidentDate,
        accessToken: session?.access_token,
      });
      setResult(answer);
      setQuestion("");
      await refreshSessionData(session.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleAsk(event) {
    event.preventDefault();
    if (!question.trim()) {
      setError("Ask a legal question before sending.");
      return;
    }
    if (parsedDate.ambiguous) {
      setClarifyDate(parsedDate.label);
      return;
    }
    if (parsedDate.error) {
      setError(parsedDate.error);
      return;
    }
    submitQuestion();
  }

  function resolveAmbiguousDate(choice) {
    if (choice === "exact") {
      setClarifyDate(null);
      setError("Please type the exact incident date, for example 2023-07-14.");
      return;
    }
    const fallbackDate = choice === "before" ? "2024-06-30" : "2024-07-01";
    setClarifyDate(null);
    setIncidentDateText(fallbackDate);
    submitQuestion(fallbackDate);
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

  if (!session) {
    return (
      <main className="login-page">
        <section className="brand-panel">
          <div className="brand-mark">
            <Scale size={30} />
          </div>
          <span className="eyebrow">IPC to BNS RAG system</span>
          <h1>Grounded legal answers with Supabase history.</h1>
          <p>
            Sign in to ask date-aware IPC/BNS questions, store consultations, and review source-backed citations.
          </p>
        </section>

        <form className="login-card" onSubmit={handleAuth}>
          <div>
            <span className="eyebrow">{mode === "signin" ? "Welcome back" : "Create access"}</span>
            <h2>{mode === "signin" ? "Sign in" : "Create account"}</h2>
          </div>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              minLength={6}
              required
            />
          </label>
          <button className="primary-button" type="submit">
            {mode === "signin" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
          <button
            className="link-button"
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
          {authMessage && <p className="message">{authMessage}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Scale size={24} />
          <div>
            <strong>LegalRAG</strong>
            <span>{profile?.role === "admin" ? "Admin console" : "Judicial assistant"}</span>
          </div>
        </div>

        <nav className="nav-stack">
          <button className={activeView === "chat" ? "active" : ""} onClick={() => setActiveView("chat")}>
            <Sparkles size={18} />
            Chat
          </button>
          <button className={activeView === "history" ? "active" : ""} onClick={() => setActiveView("history")}>
            <History size={18} />
            History
          </button>
          {profile?.role === "admin" && (
            <button className={activeView === "admin" ? "active" : ""} onClick={() => setActiveView("admin")}>
              <LayoutDashboard size={18} />
              Admin
            </button>
          )}
        </nav>

        <div className="account-box">
          <span>{session.user.email}</span>
          <button onClick={handleSignOut}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <section className="main-panel">
        <header className="app-header">
          <div>
            <span className="eyebrow">Date-aware retrieval</span>
            <h1>IPC-BNS Legal Assistant</h1>
          </div>
          <div className={`era-pill ${legalEra.toLowerCase().replace(" ", "-")}`}>
            <ShieldCheck size={18} />
            {legalEra}
          </div>
        </header>

        {activeView === "chat" && (
          <section className="chat-grid">
            <form className="composer" onSubmit={handleAsk}>
              <label>
                <span>
                  <CalendarDays size={17} />
                  Incident date
                </span>
                <input
                  value={incidentDateText}
                  onChange={(event) => setIncidentDateText(event.target.value)}
                  placeholder="2024-07-02 or 2 July 2024"
                  required
                />
              </label>
              <label>
                <span>
                  <BookOpen size={17} />
                  Legal question
                </span>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask about IPC/BNS sections, FIR, bail, offence mapping, punishment, or procedure..."
                  rows={7}
                  required
                />
              </label>
              <button className="primary-button" disabled={loading} type="submit">
                <Send size={18} />
                {loading ? "Searching legal sources..." : "Send question"}
              </button>
            </form>

            <section className="response-surface">
              {!result && !error && (
                <div className="empty-state">
                  <Search size={34} />
                  <h2>Ask a legal question to begin.</h2>
                  <p>The backend blocks non-legal queries, filters by incident date, and only answers when Pinecone has a strong source match.</p>
                </div>
              )}
              {error && (
                <div className="notice error">
                  <AlertCircle size={20} />
                  <p>{error}</p>
                </div>
              )}
              {result && (
                <article className="answer-panel">
                  <div className="answer-meta">
                    <span>Routed to {result.legal_era}</span>
                    <span>Namespace: {result.namespace}</span>
                    {result.history_id && <span>Saved</span>}
                  </div>
                  <pre>{result.answer}</pre>
                  <div className="citations">
                    {result.citations.map((citation) => (
                      <article key={citation.id || `${citation.section}-${citation.page}`}>
                        <strong>{citation.act} Section {citation.section}</strong>
                        <span>Score: {Number(citation.score || 0).toFixed(3)} | Gazette page: {citation.page}</span>
                        <p>{citation.text}</p>
                      </article>
                    ))}
                  </div>
                </article>
              )}
            </section>
          </section>
        )}

        {activeView === "history" && (
          <HistoryList title="Your Chat History" items={history} onOpen={openHistoryItem} />
        )}

        {activeView === "admin" && profile?.role === "admin" && (
          <HistoryList title="Admin: All User Queries" items={adminHistory} onOpen={openHistoryItem} showUser />
        )}
      </section>

      {clarifyDate && (
        <div className="modal-backdrop">
          <section className="modal">
            <div className="modal-icon">
              <CalendarDays size={24} />
            </div>
            <h2>Exact incident date needed</h2>
            <p>
              You entered "{clarifyDate}". The IPC/BNS route depends on the exact incident date. Enter a precise date, or choose whether the incident was before or after 1 July 2024.
            </p>
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => resolveAmbiguousDate("before")}>
                Before 1 July 2024
              </button>
              <button className="ghost-button" onClick={() => resolveAmbiguousDate("after")}>
                On/after 1 July 2024
              </button>
              <button className="primary-button compact" onClick={() => resolveAmbiguousDate("exact")}>
                <Check size={17} />
                I will enter exact date
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function HistoryList({ title, items, onOpen, showUser = false }) {
  return (
    <section className="history-page">
      <div className="section-title">
        <span className="eyebrow">{items.length} saved queries</span>
        <h2>{title}</h2>
      </div>
      <div className="history-list">
        {items.length === 0 && <p className="muted">No saved queries yet.</p>}
        {items.map((item) => (
          <button key={item.id} className="history-item" onClick={() => onOpen(item)}>
            <strong>{item.question}</strong>
            <span>
              {item.legal_era} | {item.incident_date} | {new Date(item.created_at).toLocaleString()}
            </span>
            {showUser && <small>User: {item.user_id}</small>}
          </button>
        ))}
      </div>
    </section>
  );
}

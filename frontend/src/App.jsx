import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Menu, Scale } from "lucide-react";

import {
  askLegalAssistant,
  fetchCurrentUser,
  fetchHistory,
} from "./services/api";
import { supabase } from "./services/supabase";

import Sidebar from "./components/Sidebar";
import Modal from "./components/Modal";
import Home from "./pages/Home";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import History from "./pages/History";

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
  const [activeView, setActiveView] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  
  // Auth state
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  
  // Chat state
  const [question, setQuestion] = useState("");
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
    // Startup warning for missing env vars on deployment
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      if (!import.meta.env.VITE_API_BASE_URL || !import.meta.env.VITE_SUPABASE_URL) {
        setToast("WARNING: Environment variables missing! Vercel cannot connect to the backend. Please add them in your Vercel Dashboard and redeploy.");
      }
    }

    if (!supabase) {
      setToast("WARNING: Supabase is not configured. Auth will fail.");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setHistory([]);
      }
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
      console.error("Session data fetch error:", err);
      setToast(`Failed to load data: ${err.message}`);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    if (!supabase) {
      setAuthMessage("Supabase keys are not configured.");
      return;
    }
    setAuthMessage("");
    const action =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error: authError } = await action;
    if (authError) {
      setAuthMessage(authError.message);
    } else {
      if (mode === "signup") {
        setAuthMessage("Account created. Please check your email if confirmation is required.");
      } else {
        setEmail("");
        setPassword("");
        setActiveView("chat");
      }
    }
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setHistory([]);
    setActiveView("auth");
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
      setResult({ ...answer, question_asked: question });
      setQuestion("");
      await refreshSessionData(session.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setForcedEra(null);
    }
  }

  function handleAsk(event) {
    event?.preventDefault();
    if (!isSignedIn) {
      setActiveView("auth");
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
      question_asked: item.question,
      answer: item.answer,
      legal_era: item.legal_era,
      namespace: item.legal_era?.toLowerCase(),
      citations: item.citations || [],
      history_id: item.id,
    });
    setIncidentDateText(item.incident_date || "2024-07-02");
    setActiveView("chat");
  }

  return (
    <div className={`app-layout ${theme === "dark" ? "dark-theme" : ""}`}>
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        isSignedIn={isSignedIn}
        handleSignOut={handleSignOut}
        profile={profile}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="main-content">
        <div className="mobile-header">
          <div className="mobile-header-title">
            <Scale size={20} color="var(--accent-gold)" /> NyayaSetu
          </div>
          <button className="menu-button" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
        </div>

        {activeView === "home" && <Home onStart={() => setActiveView(isSignedIn ? "chat" : "auth")} />}
        {activeView === "about" && <About />}
        {activeView === "auth" && (
          <Auth 
            mode={mode} 
            setMode={setMode} 
            email={email} 
            setEmail={setEmail} 
            password={password} 
            setPassword={setPassword} 
            handleAuth={handleAuth} 
            authMessage={authMessage} 
          />
        )}
        {activeView === "chat" && (
          <Chat 
            legalEra={legalEra} 
            incidentDateText={incidentDateText} 
            setIncidentDateText={setIncidentDateText} 
            question={question} 
            setQuestion={setQuestion} 
            handleAsk={handleAsk} 
            loading={loading} 
            result={result} 
            error={error} 
          />
        )}
        {activeView === "history" && (
          <History 
            items={history} 
            onOpen={openHistoryItem} 
          />
        )}

        {/* Global Modals */}
        {showTransitionPopup && (
          <Modal icon={<Scale size={24} />} title="Legal Transition Date Detected">
            <p>July 1, 2024 is the IPC to BNS transition date. Choose which legal framework should be used for this query.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => { setShowTransitionPopup(false); submitQuestion("2024-07-01", "IPC"); }}>Use IPC</button>
              <button className="btn btn-primary" onClick={() => { setShowTransitionPopup(false); submitQuestion("2024-07-01", "BNS"); }}><Check size={17} /> Use BNS</button>
            </div>
          </Modal>
        )}

        {clarifyDate && (
          <Modal icon={<CalendarDays size={24} />} title="Exact incident date needed">
            <p>The system detected an ambiguous date format. Please specify the exact timeframe.</p>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-outline" onClick={() => { setClarifyDate(null); setIncidentDateText("2024-06-30"); submitQuestion("2024-06-30"); }}>Before 1 July 2024 (IPC)</button>
              <button className="btn btn-outline" onClick={() => { setClarifyDate(null); setIncidentDateText("2024-07-01"); submitQuestion("2024-07-01"); }}>On/after 1 July 2024 (BNS)</button>
              <button className="btn btn-primary" onClick={() => { setClarifyDate(null); setError("Please type the exact incident date in the chat header."); }}><Check size={17} /> Enter exact date manually</button>
            </div>
          </Modal>
        )}

        {toast && (
          <div style={{ position: "fixed", bottom: "24px", right: "24px", background: "var(--text-primary)", color: "white", padding: "12px 24px", borderRadius: "8px", zIndex: 100, boxShadow: "var(--shadow-lg)", cursor: "pointer" }} onClick={() => setToast("")}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

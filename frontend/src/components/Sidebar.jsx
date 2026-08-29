import React, { useState, useRef, useEffect } from "react";
import { Scale, Home, MessageSquare, History, Info, LogOut, LogIn, X, User, Settings, ChevronUp, ChevronDown, Sun, Moon, Plus } from "lucide-react";

function categorizeConversations(conversations) {
  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: []
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  (conversations || []).forEach(conv => {
    const updated = new Date(conv.updated_at || conv.created_at);
    if (updated >= today) groups.today.push(conv);
    else if (updated >= yesterday) groups.yesterday.push(conv);
    else if (updated >= sevenDaysAgo) groups.previous7Days.push(conv);
    else groups.older.push(conv);
  });

  return groups;
}

export default function Sidebar({ activeView, setActiveView, mobileOpen, setMobileOpen, isSignedIn, handleSignOut, profile, theme, toggleTheme, handleNewChat, history, openHistoryItem, activeConversationId }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const groupedHistory = categorizeConversations(history);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "about", label: "About Us", icon: Info },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = profile?.email ? profile.email.substring(0, 2).toUpperCase() : "U";

  const renderGroup = (label, items) => {
    if (items.length === 0) return null;
    return (
      <div className="sidebar-group">
        <div className="sidebar-group-label" style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", margin: "16px 12px 8px", fontWeight: "bold", letterSpacing: "0.5px" }}>{label}</div>
        {items.map(item => (
          <button
            key={item.id}
            className={`nav-item history-item ${activeConversationId === item.id ? "active" : ""}`}
            onClick={() => openHistoryItem(item)}
            style={{ padding: "8px 12px", height: "auto", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
          >
            {item.title}
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <Scale size={28} />
          <span>NyayaSetu</span>
          {mobileOpen && (
            <button style={{ marginLeft: "auto" }} onClick={() => setMobileOpen(false)}>
              <X size={20} color="var(--text-primary)" />
            </button>
          )}
        </div>
        
        <div className="sidebar-nav" style={{ flex: 1, overflowY: "auto" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? "active" : ""}`}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}

          {isSignedIn && (
            <div style={{ marginTop: "16px", padding: "0 12px" }}>
              <button 
                className="btn btn-outline" 
                onClick={handleNewChat}
                style={{ width: "100%", justifyContent: "center", gap: "8px", border: "1px dashed var(--border-color)", background: "transparent" }}
              >
                <Plus size={16} />
                New Chat
              </button>
            </div>
          )}

          {isSignedIn && (
            <div style={{ marginTop: "16px" }}>
              {renderGroup("Today", groupedHistory.today)}
              {renderGroup("Yesterday", groupedHistory.yesterday)}
              {renderGroup("Previous 7 Days", groupedHistory.previous7Days)}
              {renderGroup("Older", groupedHistory.older)}
            </div>
          )}
        </div>
        
        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === "light" ? (
              <><Moon size={16} /> Dark Mode</>
            ) : (
              <><Sun size={16} /> Light Mode</>
            )}
          </button>
          
          {isSignedIn ? (
            <div className="profile-dropdown-container" ref={dropdownRef}>
              {profileOpen && (
                <div className="profile-menu">
                  <button className="profile-menu-item" onClick={() => { setActiveView("chat"); setProfileOpen(false); }}>
                    <User size={16} /> My Profile
                  </button>
                  <button className="profile-menu-item" onClick={() => { alert("Account Settings coming soon!"); setProfileOpen(false); }}>
                    <Settings size={16} /> Account Settings
                  </button>
                  <div style={{ height: "1px", background: "var(--border-color)", margin: "4px 0" }}></div>
                  <button className="profile-menu-item danger" onClick={handleSignOut}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
              
              <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="profile-avatar">
                  {initials}
                  <div className="online-indicator"></div>
                </div>
                <div className="profile-info">
                  <span className="profile-name">{profile?.email || "User"}</span>
                  <span className="profile-role">{profile?.role || "Free Plan"}</span>
                </div>
                {profileOpen ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronUp size={16} color="var(--text-muted)" />}
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => { setActiveView("signin"); setMobileOpen(false); }} style={{ width: "100%", padding: "12px", borderRadius: "var(--radius-md)" }}>
              <LogIn size={18} /> Sign In
            </button>
          )}
        </div>
      </aside>
      {mobileOpen && <div className="modal-overlay" onClick={() => setMobileOpen(false)} style={{ zIndex: 35 }}></div>}
    </>
  );
}

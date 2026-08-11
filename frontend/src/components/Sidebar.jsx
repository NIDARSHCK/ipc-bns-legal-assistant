import React, { useState, useRef, useEffect } from "react";
import { Scale, Home, MessageSquare, History, Info, LogOut, LogIn, X, User, Settings, ChevronUp, ChevronDown, Sun, Moon } from "lucide-react";

export default function Sidebar({ activeView, setActiveView, mobileOpen, setMobileOpen, isSignedIn, handleSignOut, profile, theme, toggleTheme }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "chat", label: "Legal Assistant", icon: MessageSquare },
    { id: "history", label: "Chat History", icon: History },
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

  // Generate initials
  const initials = profile?.email ? profile.email.substring(0, 2).toUpperCase() : "U";

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
        <nav className="sidebar-nav">
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
        </nav>
        
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
                  <button className="profile-menu-item" onClick={() => { setActiveView("history"); setProfileOpen(false); }}>
                    <History size={16} /> Chat History
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

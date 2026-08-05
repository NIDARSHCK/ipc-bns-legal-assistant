import React from "react";
import { Scale, Home, MessageSquare, History, Info, LogOut, LogIn, X } from "lucide-react";

export default function Sidebar({ activeView, setActiveView, mobileOpen, setMobileOpen, isSignedIn, handleSignOut }) {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "chat", label: "Legal Assistant", icon: MessageSquare },
    { id: "history", label: "Chat History", icon: History },
    { id: "about", label: "About Us", icon: Info },
  ];

  return (
    <>
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <Scale size={28} />
          <span>NyayaSetu</span>
          {mobileOpen && (
            <button style={{ marginLeft: "auto" }} onClick={() => setMobileOpen(false)}>
              <X size={20} />
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
          {isSignedIn ? (
            <button className="nav-item" onClick={handleSignOut} style={{ width: "100%" }}>
              <LogOut size={18} />
              Sign Out
            </button>
          ) : (
            <button className="nav-item" onClick={() => { setActiveView("auth"); setMobileOpen(false); }} style={{ width: "100%" }}>
              <LogIn size={18} />
              Sign In / Sign Up
            </button>
          )}
        </div>
      </aside>
      {mobileOpen && <div className="modal-overlay" onClick={() => setMobileOpen(false)} style={{ zIndex: 35 }}></div>}
    </>
  );
}

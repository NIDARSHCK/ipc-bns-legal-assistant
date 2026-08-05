import React, { useState } from "react";
import { MessageSquare, Clock, Search, Edit2, Trash2, Star, Plus } from "lucide-react";

export default function History({ items, onOpen }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.answer && item.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Grouping logic
  const groups = {
    "Today": [],
    "Yesterday": [],
    "Previous 7 Days": [],
    "Older": []
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);

  filteredItems.forEach(item => {
    const itemDate = new Date(item.created_at);
    if (itemDate >= today) {
      groups["Today"].push(item);
    } else if (itemDate >= yesterday) {
      groups["Yesterday"].push(item);
    } else if (itemDate >= last7Days) {
      groups["Previous 7 Days"].push(item);
    } else {
      groups["Older"].push(item);
    }
  });

  const handleMockAction = (e, action) => {
    e.stopPropagation();
    alert(`${action} functionality is coming soon.`);
  };

  return (
    <div className="main-content">
      <div className="history-workspace">
        <div className="history-header-row animate-slide-up">
          <h1>Chat History</h1>
          
          <div className="search-bar">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        </div>
        
        <div className="history-content">
          {items.length === 0 && (
            <div className="empty-state animate-fade-in" style={{ padding: "80px 20px" }}>
              <div className="empty-icon" style={{ width: "80px", height: "80px", background: "white", boxShadow: "var(--shadow-sm)" }}>
                <Clock size={40} color="var(--accent-gold)" />
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 800 }}>Legal research starts here.</h2>
              <p style={{ fontSize: "16px", marginBottom: "32px" }}>Start your first conversation with NyayaSetu.</p>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                <Plus size={18} /> Start New Chat
              </button>
            </div>
          )}

          {items.length > 0 && filteredItems.length === 0 && (
            <div className="empty-state animate-fade-in" style={{ padding: "80px 20px" }}>
              <Search size={40} color="var(--text-muted)" style={{ marginBottom: "20px" }} />
              <h2 style={{ fontSize: "24px" }}>No results found</h2>
              <p>Try adjusting your search query.</p>
            </div>
          )}

          {Object.entries(groups).map(([title, groupItems], index) => {
            if (groupItems.length === 0) return null;
            return (
              <div key={title} className={`history-group ${index === 0 ? 'animate-slide-up-delay' : 'animate-slide-up-delay-2'}`}>
                <h3 className="history-group-title">{title}</h3>
                {groupItems.map((item) => (
                  <div key={item.id} className="history-card" onClick={() => onOpen(item)}>
                    <div className="history-card-left">
                      <div className="history-card-title">{item.question}</div>
                      <div className="history-card-meta">
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span style={{ color: "var(--accent-gold)", fontWeight: 500 }}>{item.legal_era}</span>
                      </div>
                    </div>
                    
                    <div className="history-card-actions">
                      <button className="action-btn" onClick={(e) => handleMockAction(e, 'Favorite')} title="Favorite">
                        <Star size={16} />
                      </button>
                      <button className="action-btn" onClick={(e) => handleMockAction(e, 'Rename')} title="Rename">
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn action-btn-danger" onClick={(e) => handleMockAction(e, 'Delete')} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { MessageSquare, Clock } from "lucide-react";

export default function History({ items, onOpen }) {
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

  items.forEach(item => {
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

  return (
    <div className="main-content">
      <div className="history-container">
        <h1>Chat History</h1>
        
        {items.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><Clock size={32} /></div>
            <h2>No history yet</h2>
            <p>Your previous legal research queries will appear here.</p>
          </div>
        )}

        {Object.entries(groups).map(([title, groupItems]) => {
          if (groupItems.length === 0) return null;
          return (
            <div key={title} className="history-group">
              <h3>{title}</h3>
              {groupItems.map((item) => (
                <button key={item.id} className="history-item-card" onClick={() => onOpen(item)}>
                  <div className="history-item-content" style={{ textAlign: 'left' }}>
                    <h4>{item.question}</h4>
                    <p>{item.legal_era} • {item.incident_date}</p>
                  </div>
                  <MessageSquare size={18} color="var(--text-muted)" />
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

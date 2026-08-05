import React from "react";

export default function Modal({ icon, title, children }) {
  return (
    <div className="modal-overlay">
      <section className="modal-content">
        <div className="modal-icon">{icon}</div>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

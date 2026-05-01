const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function askLegalAssistant({ question, incidentDate, accessToken }) {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      question,
      incident_date: incidentDate,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "The legal assistant could not answer right now.");
  }
  return data;
}

export async function fetchCurrentUser(accessToken) {
  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Could not load user profile.");
  return data;
}

export async function fetchHistory(accessToken) {
  const response = await fetch(`${API_BASE_URL}/history`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Could not load chat history.");
  return data.items || [];
}

export async function fetchAdminHistory(accessToken) {
  const response = await fetch(`${API_BASE_URL}/admin/history`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Could not load admin history.");
  return data.items || [];
}

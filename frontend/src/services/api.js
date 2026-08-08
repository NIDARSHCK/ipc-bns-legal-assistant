const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://ipc-bns-legal-assistant.onrender.com").replace(/\/+$/, "");

// Helper to safely parse JSON or throw a readable error if the backend returns HTML (e.g. 502 Bad Gateway)
async function fetchWithJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error("Network error: Could not connect to the server. Please check your connection or backend URL.");
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    // If json parsing fails, it's likely an HTML error page (e.g. Render 502/503)
    if (!response.ok) {
      throw new Error(`Server Error (${response.status}): ${response.statusText}`);
    }
    throw new Error("Invalid response from server.");
  }

  if (!response.ok) {
    throw new Error(data.detail || data.message || `Error ${response.status}: ${response.statusText}`);
  }

  return data;
}

export async function askLegalAssistant({
  question,
  incidentDate,
  forcedEra,
  accessToken,
})  {
  return fetchWithJson(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      question,
      incident_date: incidentDate,
      forced_era: forcedEra, 
    }),
  });
}

export async function fetchMappings() {
  const data = await fetchWithJson(`${API_BASE_URL}/mapping`);
  return data.items || [];
}

export async function fetchCurrentUser(accessToken) {
  return fetchWithJson(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchHistory(accessToken) {
  const data = await fetchWithJson(`${API_BASE_URL}/history`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.items || [];
}

export async function fetchAdminHistory(accessToken) {
  const data = await fetchWithJson(`${API_BASE_URL}/admin/history`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.items || [];
}

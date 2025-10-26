// src/services/api.js
const API_BASE = "http://localhost:8000"; // Changed from 6060 to 8000

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

async function apiPost(endpoint, data = null) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : null,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

async function apiDelete(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}

export default {
  get: apiGet,
  post: apiPost,
  delete: apiDelete,
};

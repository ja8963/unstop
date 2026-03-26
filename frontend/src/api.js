const API_BASE = "http://localhost:8000/api";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

export const fetchMedicines = () => apiFetch("/medicines");

export const fetchCompliance = (medicine_name) =>
  apiFetch("/compliance", {
    method: "POST",
    body: JSON.stringify({ medicine_name }),
  });

export const fetchExplain = (medicine_name) =>
  apiFetch("/explain", {
    method: "POST",
    body: JSON.stringify({ medicine_name }),
  });

export const fetchInventory = (medicine_name) =>
  apiFetch("/inventory", {
    method: "POST",
    body: JSON.stringify({ medicine_name }),
  });

export const fetchRecommend = (medicine_name) =>
  apiFetch("/recommend", {
    method: "POST",
    body: JSON.stringify({ medicine_name }),
  });

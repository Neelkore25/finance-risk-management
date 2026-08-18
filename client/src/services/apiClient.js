/**
 * RiskGuard - Single API & Data Service Layer
 * Reusable fetch wrapper with JWT header injection & standardized error parsing.
 */

const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('riskguard_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('riskguard_token', token);
  } else {
    localStorage.removeItem('riskguard_token');
  }
}

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Clear invalid token if unauthenticated
    setAuthToken(null);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status} Request Failed`);
  }

  return data;
}

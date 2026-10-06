// FinSec ZeroTrust API Client with HMAC Signing and Auto-Refresh Token Rotation

const API_BASE = '/api/v1';
const DEFAULT_HMAC_SECRET = 'finsec_hmac_request_signing_secret_key_2026_default';

// Helper to compute HMAC-SHA256 in browser using Web Crypto API
async function computeHmacSha256(secret, message) {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const getAccessToken = () => localStorage.getItem('finsec_access_token');
export const setAccessToken = (token) => {
  if (token) localStorage.setItem('finsec_access_token', token);
  else localStorage.removeItem('finsec_access_token');
};

export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') || endpoint.startsWith('/api') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = { ...options.headers };

  // Add Bearer Token if present
  const token = getAccessToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Compute HMAC Signature for mutation requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !(options.body instanceof FormData)) {
    const timestamp = Date.now().toString();
    const payload = `${timestamp}.${options.body || '{}'}`;
    try {
      const signature = await computeHmacSha256(DEFAULT_HMAC_SECRET, payload);
      headers['x-hmac-signature'] = signature;
      headers['x-hmac-timestamp'] = timestamp;
    } catch (e) {
      console.warn('HMAC calculation skipped:', e);
    }
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Sends HttpOnly refresh cookies
  });

  // If access token expired, attempt automatic refresh rotation
  if (res.status === 401) {
    const data = await res.clone().json().catch(() => ({}));
    if (data.code === 'TOKEN_EXPIRED') {
      console.log('[FinSec Auth] 5-minute access token expired. Rotating refresh session...');
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setAccessToken(refreshData.accessToken);

          // Retry initial request with new token
          headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
          res = await fetch(url, {
            ...options,
            headers,
            credentials: 'include'
          });
        } else {
          // Session expired
          setAccessToken(null);
          window.dispatchEvent(new CustomEvent('finsec_logout'));
        }
      } catch (refreshErr) {
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent('finsec_logout'));
      }
    }
  }

  return res;
};

// API Services
export const authApi = {
  login: (data) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  profile: () => apiFetch('/auth/profile'),
  updateProfile: (data) => apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  webauthnRegisterOptions: () => apiFetch('/auth/webauthn/generate-registration-options', { method: 'POST' }),
  webauthnVerifyRegistration: (data) => apiFetch('/auth/webauthn/verify-registration', { method: 'POST', body: JSON.stringify(data) }),
  webauthnAuthOptions: (data) => apiFetch('/auth/webauthn/generate-authentication-options', { method: 'POST', body: JSON.stringify(data) }),
  webauthnVerifyAuth: (data) => apiFetch('/auth/webauthn/verify-authentication', { method: 'POST', body: JSON.stringify(data) })
};

export const transactionApi = {
  list: (params = '') => apiFetch(`/transactions${params}`),
  summary: () => apiFetch('/transactions/summary'),
  create: (data) => apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/transactions/${id}`, { method: 'DELETE' }),
  exportUrl: (format = 'csv') => `${API_BASE}/transactions/export?format=${format}`,
  verifyLedger: () => apiFetch('/transactions/ledger/verify')
};

export const budgetApi = {
  list: () => apiFetch('/budgets'),
  set: (data) => apiFetch('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/budgets/${id}`, { method: 'DELETE' })
};

export const receiptApi = {
  scan: (formData) => apiFetch('/receipts/scan', { method: 'POST', body: formData })
};

export const aiApi = {
  assistant: (query) => apiFetch('/ai/assistant', { method: 'POST', body: JSON.stringify({ query }) }),
  confirmAction: (action) => apiFetch('/ai/action/confirm', { method: 'POST', body: JSON.stringify({ action }) })
};

export const socApi = {
  stats: () => apiFetch('/admin/stats'),
  logs: (params = '') => apiFetch(`/admin/logs${params}`),
  simulateAttack: (data) => apiFetch('/admin/simulate-attack', { method: 'POST', body: JSON.stringify(data) }),
  triggerHoneypot: (data) => apiFetch('/admin/login-v1', { method: 'POST', body: JSON.stringify(data) })
};

export const bankApi = {
  simulateWebhook: (data) => apiFetch('/bank/webhook/transaction', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id) => apiFetch(`/bank/transaction/${id}/approve`, { method: 'POST' }),
  block: (id) => apiFetch(`/bank/transaction/${id}/block`, { method: 'POST' })
};

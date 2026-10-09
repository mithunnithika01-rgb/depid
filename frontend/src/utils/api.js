/**
 * API utility — all backend communication goes through here.
 */

const API_BASE = 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ─── Brand Profile ────────────────────────────────────────────

export const brandApi = {
  list: () => request('/brand/'),
  get: (id) => request(`/brand/${id}`),
  create: (data) => request('/brand/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/brand/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/brand/${id}`, { method: 'DELETE' }),
  uploadLogo: async (id, file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await fetch(`${API_BASE}/brand/${id}/logo`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },
};

// ─── Scanning ─────────────────────────────────────────────────

export const scanApi = {
  start: (brandId, platforms = null) =>
    request('/scan/start', {
      method: 'POST',
      body: JSON.stringify({ brand_id: brandId, platforms }),
    }),
  status: (jobId) => request(`/scan/status/${jobId}`),
  history: (brandId) => request(`/scan/history/${brandId}`),
};

// ─── Threats ──────────────────────────────────────────────────

export const threatsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/threats/?${query}`);
  },
  stats: (brandId = null) => {
    const query = brandId ? `?brand_id=${brandId}` : '';
    return request(`/threats/stats${query}`);
  },
  get: (id) => request(`/threats/${id}`),
  updateAction: (id, action) =>
    request(`/threats/${id}/action?action=${action}`, { method: 'PUT' }),
};

// ─── Public Portal ────────────────────────────────────────────

export const publicApi = {
  check: (url) =>
    request('/public/check', { method: 'POST', body: JSON.stringify({ url }) }),
  report: (url, description = '') =>
    request('/public/report', {
      method: 'POST',
      body: JSON.stringify({ reported_url: url, description }),
    }),
};

// ─── Authentication & Users ──────────────────────────────────

export const authApi = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  signup: (username, email, password, role = 'USER', permissions = 'READ,SCAN') =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role, permissions }),
    }),
  me: (username = 'mithun') => request(`/auth/me?username=${username}`),
  listUsers: () => request('/auth/users'),
};


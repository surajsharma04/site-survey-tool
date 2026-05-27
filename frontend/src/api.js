const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

export const apiRequest = async (path, options = {}) => {
  const session = JSON.parse(localStorage.getItem('siteSurveySession') || 'null');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

export const authApi = {
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  register: ({ fullName, email, password, role }) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password, role }),
  }),
};

export const siteApi = {
  properties: () => apiRequest('/sites/properties'),
  createProperty: (property) => apiRequest('/sites/properties', {
    method: 'POST',
    body: JSON.stringify(property),
  }),
};

import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Category API
export const categoryAPI = {
  getCategories: (type) => api.get('/categories', { params: { type } }),
  createCategory: (data) => api.post('/categories', data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Transaction API
export const transactionAPI = {
  getTransactions: (params) => api.get('/transactions', { params }),
  createTransaction: (data) => api.post('/transactions', data),
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getMonthlyTrend: (params) => api.get('/dashboard/monthly-trend', { params }),
  getBudgetStatus: (params) => api.get('/budget/status', { params }),
  getPeriodStats: (params) => api.get('/dashboard/period-stats', { params }),
};

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getFamily: () => api.get('/auth/family'),
  joinFamily: (familyCode) => api.post('/auth/join-family', { family_code: familyCode }),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  removeMember: (userId) => api.post('/auth/remove-member', { user_id: userId }),
};

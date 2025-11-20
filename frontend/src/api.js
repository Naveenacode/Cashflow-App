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

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
};

// KYC API
export const kycAPI = {
  submit: (data) => api.post('/kyc/submit', data),
  getStatus: () => api.get('/kyc/status'),
  getPending: () => api.get('/kyc/pending'),
  review: (id, data) => api.post(`/kyc/${id}/review`, data),
};

// Deal API
export const dealAPI = {
  getDeals: (status) => api.get('/deals', { params: { status } }),
  getDeal: (id) => api.get(`/deals/${id}`),
  createDeal: (data) => api.post('/deals', data),
  updateDeal: (id, data) => api.put(`/deals/${id}`, data),
  deleteDeal: (id) => api.delete(`/deals/${id}`),
};

// Investment API
export const investmentAPI = {
  createInvestment: (data) => api.post('/investments', data),
  getUserInvestments: () => api.get('/investments'),
  getAllInvestments: () => api.get('/investments/all'),
  getPortfolio: () => api.get('/portfolio'),
};

// Syndicate API
export const syndicateAPI = {
  getSyndicates: (params) => api.get('/syndicates', { params }),
  getSyndicate: (id) => api.get(`/syndicates/${id}`),
  createSyndicate: (data) => api.post('/syndicates', data),
  addMember: (id, data) => api.post(`/syndicates/${id}/members`, data),
  getMembers: (id) => api.get(`/syndicates/${id}/members`),
  blockSyndicate: (id) => api.put(`/syndicates/${id}/block`),
  unblockSyndicate: (id) => api.put(`/syndicates/${id}/unblock`),
};

// Withdrawal API
export const withdrawalAPI = {
  create: (data) => api.post('/withdrawals', data),
  getUserWithdrawals: () => api.get('/withdrawals'),
  getAllWithdrawals: () => api.get('/withdrawals/all'),
  approve: (id) => api.put(`/withdrawals/${id}/approve`),
};

// Feedback API
export const feedbackAPI = {
  create: (data) => api.post('/feedback', data),
  getUserFeedback: () => api.get('/feedback'),
  getAllFeedback: () => api.get('/feedback/all'),
  markReviewed: (id) => api.put(`/feedback/${id}/reviewed`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
};

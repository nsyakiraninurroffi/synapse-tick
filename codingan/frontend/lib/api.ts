import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Events
export const eventAPI = {
  getAll: (params?: any) => api.get('/events', { params }),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  getMyEvents: () => api.get('/events/my'),
  togglePublish: (id: string) => api.patch(`/events/${id}/publish`),
};

// Tickets
export const ticketAPI = {
  book: (data: any) => api.post('/tickets/book', data),
  getMyTickets: () => api.get('/tickets/my'),
  getById: (id: string) => api.get(`/tickets/${id}`),
  checkQueue: (eventId: string) => api.get(`/tickets/queue/${eventId}`),
  refreshQr: (id: string) => api.post(`/tickets/${id}/refresh-qr`),
};

// Payment
export const paymentAPI = {
  // Midtrans Snap
  createSnap: (referenceId: string) => api.post('/payment/create-snap', { referenceId }),

  // Legacy
  callback: (data: any) => api.post('/payment/callback', data),
  mockSuccess: (referenceId: string) => api.post('/payment/mock-success', { referenceId }),
  checkStatus: (referenceId: string) => api.get(`/payment/status/${referenceId}`),
  topUp: (data: any) => api.post('/payment/topup', data),
};

// Gate
export const gateAPI = {
  verify: (qrToken: string) => api.post('/gate/verify', { qrToken }),
  sync: (offlineLogs: any[]) => api.post('/gate/sync', { offlineLogs }),
  download: (eventId: string) => api.get(`/gate/download/${eventId}`),
};

// Wallet
export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params?: any) => api.get('/wallet/transactions', { params }),
  updateNfc: (nfcUid: string) => api.put('/wallet/nfc', { nfcUid }),
};

// Vendor
export const vendorAPI = {
  pay: (data: any) => api.post('/vendors/pay', data),
  getTransactions: () => api.get('/vendors/transactions'),
  getByEvent: (eventId: string) => api.get(`/vendors/event/${eventId}`),
  register: (data: any) => api.post('/vendors/register', data),
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getEventAnalytics: (eventId: string) => api.get(`/analytics/events/${eventId}`),
};

// Promo Codes
export const promoAPI = {
  create: (data: any) => api.post('/promo', data),
  validate: (data: { kode: string; eventId: string; totalHarga: number }) => api.post('/promo/validate', data),
  getByEvent: (eventId: string) => api.get(`/promo/event/${eventId}`),
  delete: (id: string) => api.delete(`/promo/${id}`),
};

export default api;

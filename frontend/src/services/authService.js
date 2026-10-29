import api from './api';

// Authentication related endpoints.
const authService = {
  register(payload) {
    return api.post('/auth/register', payload);
  },

  login(email, password) {
    return api.post('/auth/login', { email, password });
  },

  getMe() {
    return api.get('/auth/me');
  },

  forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword(token, password) {
    return api.post('/auth/reset-password', { token, password });
  },
};

export default authService;

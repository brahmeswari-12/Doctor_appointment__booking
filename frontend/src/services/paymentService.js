import api from './api';

// Payment endpoints (Razorpay when keys are configured, built-in simulator otherwise).
const paymentService = {
  getConfig() {
    return api.get('/payments/config');
  },

  // payload: { appointmentId, method }  -> cash | card | upi | netbanking | wallet
  createOrder(payload) {
    return api.post('/payments/orders', payload);
  },

  // payload: { appointmentId, orderId, paymentId, signature }
  verify(payload) {
    return api.post('/payments/verify', payload);
  },

  // payload: { appointmentId, orderId, reason }
  fail(payload) {
    return api.post('/payments/fail', payload);
  },
};

export default paymentService;

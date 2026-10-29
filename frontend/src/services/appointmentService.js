import api from './api';

// Appointment endpoints (role scoped by the backend).
const appointmentService = {
  create(payload) {
    return api.post('/appointments', payload);
  },

  // params: { status, filter } where filter is today | upcoming | past
  getAppointments(params = {}) {
    return api.get('/appointments', { params });
  },

  getAppointmentById(id) {
    return api.get(`/appointments/${id}`);
  },

  update(id, payload) {
    return api.put(`/appointments/${id}`, payload);
  },

  remove(id) {
    return api.delete(`/appointments/${id}`);
  },
};

export default appointmentService;

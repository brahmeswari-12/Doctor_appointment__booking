import api from './api';

// Admin only endpoints.
const adminService = {
  getStats() {
    return api.get('/admin/stats');
  },

  getUsers(params = {}) {
    return api.get('/admin/users', { params });
  },

  getPatients(params = {}) {
    return api.get('/admin/patients', { params });
  },

  getDoctors(params = {}) {
    return api.get('/admin/doctors', { params });
  },

  getAppointments(params = {}) {
    return api.get('/admin/appointments', { params });
  },

  createDoctor(payload) {
    return api.post('/admin/doctors', payload);
  },

  updateDoctor(id, payload) {
    return api.put(`/admin/doctors/${id}`, payload);
  },

  deleteDoctor(id) {
    return api.delete(`/admin/doctors/${id}`);
  },

  approveDoctor(id, status) {
    return api.put(`/admin/doctors/${id}/approve`, { status });
  },

  updateUserStatus(id, status) {
    return api.put(`/admin/users/${id}/status`, { status });
  },

  deleteUser(id) {
    return api.delete(`/admin/users/${id}`);
  },

  getSpecializations(params = {}) {
    return api.get('/admin/specializations', { params });
  },

  createSpecialization(payload) {
    return api.post('/admin/specializations', payload);
  },

  updateSpecialization(id, payload) {
    return api.put(`/admin/specializations/${id}`, payload);
  },

  deleteSpecialization(id) {
    return api.delete(`/admin/specializations/${id}`);
  },
};

export default adminService;

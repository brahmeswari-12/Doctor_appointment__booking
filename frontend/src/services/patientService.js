import api from './api';

// Patient scoped endpoints (require the patient role).
const patientService = {
  getProfile() {
    return api.get('/patients/profile');
  },

  updateProfile(payload) {
    return api.put('/patients/profile', payload);
  },

  getAppointments() {
    return api.get('/patients/appointments');
  },
};

export default patientService;

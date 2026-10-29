import api from './api';

// Doctor directory + doctor self-service endpoints.
const doctorService = {
  // Public listing with optional search and specialization filter.
  getDoctors(params = {}) {
    return api.get('/doctors', { params });
  },

  getSpecializations() {
    return api.get('/doctors/specializations');
  },

  getDoctorById(id) {
    return api.get(`/doctors/${id}`);
  },

  getDoctorSchedule(id) {
    return api.get(`/doctors/${id}/schedule`);
  },

  getDoctorSlots(id, date) {
    return api.get(`/doctors/${id}/slots`, { params: { date } });
  },

  // Doctor role: update own profile.
  updateProfile(payload) {
    return api.put('/doctors/profile', payload);
  },

  // Doctor role: replace weekly schedule.
  updateSchedule(schedules) {
    return api.put('/doctors/schedule', { schedules });
  },
};

export default doctorService;

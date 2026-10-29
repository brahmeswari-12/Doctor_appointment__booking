const userModel = require('../models/userModel');
const patientModel = require('../models/patientModel');
const doctorModel = require('../models/doctorModel');
const specializationModel = require('../models/specializationModel');
const appointmentModel = require('../models/appointmentModel');
const { hashPassword } = require('../utils/password');
const ApiError = require('../utils/ApiError');
const { toUser, toPatient, toDoctorCard, toAppointment, toSpecialization } = require('../utils/serializers');

async function getStats() {
  const [doctorCounts, appointmentCounts, paymentStats, [patientRows]] = await Promise.all([
    doctorModel.countByStatus(),
    appointmentModel.countByStatus(),
    appointmentModel.countPaymentStats(),
    require('../config/db').pool.query('SELECT COUNT(*) AS total FROM patients'),
  ]);

  return {
    totalPatients: patientRows[0].total,
    totalDoctors: Object.values(doctorCounts).reduce((sum, n) => sum + Number(n), 0),
    pendingDoctors: Number(doctorCounts.pending || 0),
    totalAppointments: Object.values(appointmentCounts).reduce((sum, n) => sum + Number(n), 0),
    pendingAppointments: Number(appointmentCounts.pending || 0),
    confirmedAppointments: Number(appointmentCounts.confirmed || 0),
    completedAppointments: Number(appointmentCounts.completed || 0),
    cancelledAppointments: Number(appointmentCounts.cancelled || 0),
    paidAppointments: paymentStats.paid,
    unpaidAppointments: paymentStats.unpaid,
    refundedAppointments: paymentStats.refunded,
    totalRevenue: paymentStats.revenue,
  };
}

async function listUsers(filters = {}) {
  const rows = await userModel.list(filters);
  return rows.map(toUser);
}

async function listPatients(filters = {}) {
  const rows = await patientModel.list(filters);
  return rows.map(toPatient);
}

async function listDoctors(filters = {}) {
  const rows = await doctorModel.list(filters);
  return rows.map(toDoctorCard);
}

async function listAppointments(filters = {}) {
  const rows = await appointmentModel.list(filters);
  return rows.map(toAppointment);
}

/** Admin-created doctor: the account is created and immediately approved. */
async function createDoctor(payload) {
  const existing = await userModel.findByEmail(payload.email);
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const hashedPassword = await hashPassword(payload.password);
  const userId = await userModel.create({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: hashedPassword,
    role: 'doctor',
  });

  await doctorModel.create({
    userId,
    specializationId: payload.specializationId || null,
    qualification: payload.qualification || null,
    experience: payload.experience || 0,
    consultationFee: payload.consultationFee || 0,
    bio: payload.bio || null,
    status: payload.status || 'approved',
  });

  const doctor = await doctorModel.findByUserId(userId);
  return toDoctorCard(doctor);
}

async function updateDoctor(doctorId, payload) {
  const doctor = await doctorModel.findById(doctorId);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found.');
  }

  await userModel.update(doctor.userId, { name: payload.name, phone: payload.phone });
  await doctorModel.updateById(doctorId, {
    specializationId: payload.specializationId,
    qualification: payload.qualification,
    experience: payload.experience,
    consultationFee: payload.consultationFee,
    bio: payload.bio,
    status: payload.status,
  });

  return toDoctorCard(await doctorModel.findById(doctorId));
}

/** Deletes the doctor profile together with its user account. */
async function deleteDoctor(doctorId) {
  const doctor = await doctorModel.findById(doctorId);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found.');
  }
  await userModel.remove(doctor.userId); // cascades to the doctors row
  return { message: 'Doctor deleted successfully.' };
}

async function approveDoctor(doctorId, status) {
  const doctor = await doctorModel.findById(doctorId);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found.');
  }
  await doctorModel.updateById(doctorId, { status });
  return toDoctorCard(await doctorModel.findById(doctorId));
}

async function setUserStatus(userId, status) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  if (user.role === 'admin') {
    throw ApiError.forbidden('Administrator accounts cannot be deactivated here.');
  }
  await userModel.update(userId, { status });
  return toUser(await userModel.findById(userId));
}

async function deleteUser(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  if (user.role === 'admin') {
    throw ApiError.forbidden('Administrator accounts cannot be deleted.');
  }
  await userModel.remove(userId);
  return { message: 'User deleted successfully.' };
}

/* ----------------------------- Specializations ---------------------------- */

async function listSpecializations() {
  const rows = await specializationModel.list();
  return rows.map(toSpecialization);
}

async function createSpecialization(payload) {
  const existing = await specializationModel.findByName(payload.name);
  if (existing) {
    throw ApiError.conflict('A specialization with that name already exists.');
  }
  const id = await specializationModel.create({
    name: payload.name,
    description: payload.description || null,
  });
  return toSpecialization(await specializationModel.findById(id));
}

async function updateSpecialization(id, payload) {
  const existing = await specializationModel.findById(id);
  if (!existing) {
    throw ApiError.notFound('Specialization not found.');
  }
  await specializationModel.update(id, {
    name: payload.name,
    description: payload.description,
  });
  return toSpecialization(await specializationModel.findById(id));
}

async function deleteSpecialization(id) {
  const existing = await specializationModel.findById(id);
  if (!existing) {
    throw ApiError.notFound('Specialization not found.');
  }
  await specializationModel.remove(id);
  return { message: 'Specialization deleted successfully.' };
}

module.exports = {
  getStats,
  listUsers,
  listPatients,
  listDoctors,
  listAppointments,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  approveDoctor,
  setUserStatus,
  deleteUser,
  listSpecializations,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
};

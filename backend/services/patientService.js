const userModel = require('../models/userModel');
const patientModel = require('../models/patientModel');
const appointmentModel = require('../models/appointmentModel');
const ApiError = require('../utils/ApiError');
const { toPatient, toAppointment } = require('../utils/serializers');

async function getProfile(userId) {
  const patient = await patientModel.findByUserId(userId);
  if (!patient) {
    throw ApiError.notFound('Patient profile not found.');
  }
  return toPatient(patient);
}

async function updateProfile(userId, data) {
  const patient = await patientModel.findByUserId(userId);
  if (!patient) {
    throw ApiError.notFound('Patient profile not found.');
  }

  await userModel.update(userId, { name: data.name, phone: data.phone });
  await patientModel.updateByUserId(userId, {
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    address: data.address,
    medicalHistory: data.medicalHistory,
  });

  return getProfile(userId);
}

async function getAppointments(userId, filters = {}) {
  const patient = await patientModel.findByUserId(userId);
  if (!patient) {
    throw ApiError.notFound('Patient profile not found.');
  }
  const rows = await appointmentModel.list({ ...filters, patientId: patient.id });
  return rows.map(toAppointment);
}

module.exports = { getProfile, updateProfile, getAppointments };

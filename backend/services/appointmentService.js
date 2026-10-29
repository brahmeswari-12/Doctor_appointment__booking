const patientModel = require('../models/patientModel');
const doctorModel = require('../models/doctorModel');
const scheduleModel = require('../models/scheduleModel');
const appointmentModel = require('../models/appointmentModel');
const paymentService = require('./paymentService');
const ApiError = require('../utils/ApiError');
const { toAppointment } = require('../utils/serializers');
const { dayNameFromDate, toHHMM } = require('../utils/dateTime');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;
const ACTIVE_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Resolves the patient row belonging to the authenticated user. */
async function requirePatientProfile(userId) {
  const patient = await patientModel.findByUserId(userId);
  if (!patient) {
    throw ApiError.forbidden('Only patients can perform this action.');
  }
  return patient;
}

async function createAppointment(user, data) {
  const patient = await requirePatientProfile(user.id);

  const doctor = await doctorModel.findById(data.doctorId);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found.');
  }
  if (doctor.status !== 'approved') {
    throw ApiError.badRequest('This doctor is not currently accepting appointments.');
  }

  const date = String(data.appointmentDate);
  if (!DATE_PATTERN.test(date)) {
    throw ApiError.badRequest('Appointment date must be in YYYY-MM-DD format.');
  }
  if (date < todayString()) {
    throw ApiError.badRequest('You cannot book an appointment in the past.');
  }

  const time = toHHMM(String(data.appointmentTime));
  if (!TIME_PATTERN.test(String(data.appointmentTime))) {
    throw ApiError.badRequest('Appointment time must be in HH:MM format.');
  }

  const schedule = await scheduleModel.findByDoctorAndDay(doctor.id, dayNameFromDate(date));
  if (!schedule || !Number(schedule.available)) {
    throw ApiError.badRequest('The doctor is not available on the selected day.');
  }
  if (time < toHHMM(schedule.startTime) || time >= toHHMM(schedule.endTime)) {
    throw ApiError.badRequest("The selected time is outside the doctor's working hours.");
  }

  const conflict = await appointmentModel.findConflict({
    doctorId: doctor.id,
    appointmentDate: date,
    appointmentTime: time,
  });
  if (conflict) {
    throw ApiError.conflict('That time slot has already been booked. Please pick another slot.');
  }

  const id = await appointmentModel.create({
    patientId: patient.id,
    doctorId: doctor.id,
    appointmentDate: date,
    appointmentTime: time,
    reason: data.reason || null,
  });

  return toAppointment(await appointmentModel.findById(id));
}

/** Returns appointments scoped to the caller's role. */
async function listAppointments(user, filters = {}) {
  const scope = { ...filters };

  if (user.role === 'patient') {
    scope.patientId = (await requirePatientProfile(user.id)).id;
  } else if (user.role === 'doctor') {
    const doctor = await doctorModel.findByUserId(user.id);
    if (!doctor) {
      throw ApiError.forbidden('Doctor profile not found.');
    }
    scope.doctorId = doctor.id;
  }

  const rows = await appointmentModel.list(scope);
  return rows.map(toAppointment);
}

/** Loads an appointment and asserts the caller is allowed to see it. */
async function getAppointment(user, id) {
  const appointment = await appointmentModel.findById(id);
  if (!appointment) {
    throw ApiError.notFound('Appointment not found.');
  }
  await assertCanAccess(user, appointment);
  return toAppointment(appointment);
}

async function assertCanAccess(user, appointment) {
  if (user.role === 'admin') return;

  if (user.role === 'patient') {
    const patient = await patientModel.findByUserId(user.id);
    if (patient && patient.id === appointment.patientId) return;
  }

  if (user.role === 'doctor') {
    const doctor = await doctorModel.findByUserId(user.id);
    if (doctor && doctor.id === appointment.doctorId) return;
  }

  throw ApiError.forbidden('You do not have access to this appointment.');
}

/** Updates status and/or reschedules an appointment according to role rules. */
async function updateAppointment(user, id, data) {
  const appointment = await appointmentModel.findById(id);
  if (!appointment) {
    throw ApiError.notFound('Appointment not found.');
  }
  await assertCanAccess(user, appointment);

  if (data.status !== undefined) {
    if (!ACTIVE_STATUSES.includes(data.status)) {
      throw ApiError.badRequest('Invalid appointment status.');
    }
    await assertStatusTransition(user, appointment, data.status);
    await appointmentModel.updateStatus(id, data.status);

    // A paid booking that gets cancelled is refunded automatically.
    if (data.status === 'cancelled' && appointment.paymentStatus === 'paid') {
      await paymentService.refundForAppointment(id);
    }
  }

  const isRescheduling = data.appointmentDate !== undefined || data.appointmentTime !== undefined;
  if (isRescheduling) {
    if (user.role !== 'patient' && user.role !== 'admin') {
      throw ApiError.forbidden('Only the patient or an administrator can reschedule an appointment.');
    }
    if (['completed', 'cancelled'].includes(appointment.status)) {
      throw ApiError.badRequest('Completed or cancelled appointments cannot be rescheduled.');
    }

    const date = data.appointmentDate !== undefined ? String(data.appointmentDate) : appointment.appointmentDate;
    const time = toHHMM(data.appointmentTime !== undefined ? String(data.appointmentTime) : appointment.appointmentTime);

    if (date < todayString()) {
      throw ApiError.badRequest('You cannot reschedule an appointment into the past.');
    }

    const schedule = await scheduleModel.findByDoctorAndDay(appointment.doctorId, dayNameFromDate(date));
    if (!schedule || !Number(schedule.available) || time < toHHMM(schedule.startTime) || time >= toHHMM(schedule.endTime)) {
      throw ApiError.badRequest('The doctor is not available at the requested date and time.');
    }

    const conflict = await appointmentModel.findConflict({
      doctorId: appointment.doctorId,
      appointmentDate: date,
      appointmentTime: time,
      excludeId: appointment.id,
    });
    if (conflict) {
      throw ApiError.conflict('That time slot has already been booked. Please pick another slot.');
    }

    await appointmentModel.reschedule(id, {
      appointmentDate: date,
      appointmentTime: time,
      reason: data.reason,
    });
  }

  return toAppointment(await appointmentModel.findById(id));
}

async function assertStatusTransition(user, appointment, nextStatus) {
  const current = appointment.status;
  if (current === nextStatus) return;

  if (user.role === 'admin') return;

  if (user.role === 'patient') {
    // Patients may only cancel their own not-yet-completed appointments.
    if (nextStatus !== 'cancelled') {
      throw ApiError.forbidden('Patients can only cancel appointments.');
    }
    if (['completed', 'cancelled'].includes(current)) {
      throw ApiError.badRequest('This appointment can no longer be cancelled.');
    }
    return;
  }

  if (user.role === 'doctor') {
    const allowed = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
    };
    if (!(allowed[current] || []).includes(nextStatus)) {
      throw ApiError.badRequest(`Cannot change status from "${current}" to "${nextStatus}".`);
    }
    return;
  }

  throw ApiError.forbidden('You are not allowed to change this appointment.');
}

/** Cancels (soft delete) an appointment. */
async function cancelAppointment(user, id) {
  return updateAppointment(user, id, { status: 'cancelled' });
}

/** Hard deletes an appointment (admin only). */
async function deleteAppointment(user, id) {
  if (user.role !== 'admin') {
    throw ApiError.forbidden('Only an administrator can delete an appointment.');
  }
  const appointment = await appointmentModel.findById(id);
  if (!appointment) {
    throw ApiError.notFound('Appointment not found.');
  }
  await appointmentModel.remove(id);
  return { message: 'Appointment deleted successfully.' };
}

module.exports = {
  createAppointment,
  listAppointments,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  deleteAppointment,
};

const userModel = require('../models/userModel');
const doctorModel = require('../models/doctorModel');
const scheduleModel = require('../models/scheduleModel');
const appointmentModel = require('../models/appointmentModel');
const specializationModel = require('../models/specializationModel');
const ApiError = require('../utils/ApiError');
const { toDoctorCard, toSchedule, toSpecialization } = require('../utils/serializers');
const { dayNameFromDate, toHHMM, DAY_NAMES } = require('../utils/dateTime');

const SLOT_DURATION_MINUTES = 30;

function toMinutes(time) {
  const [hours, minutes] = String(time).split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToHHMM(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Builds the bookable "HH:MM" slots between two times, excluding times that
 * already passed (cutoff) and times that are already booked.
 */
function buildSlots({ startTime, endTime, booked = [], cutoffMinutes = -1 }) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const slots = [];
  for (let cursor = start; cursor + SLOT_DURATION_MINUTES <= end; cursor += SLOT_DURATION_MINUTES) {
    const label = minutesToHHMM(cursor);
    if (cursor <= cutoffMinutes) continue;
    if (booked.includes(label)) continue;
    slots.push(label);
  }
  return slots;
}

/**
 * Attaches a "today" availability summary to serialized doctor cards:
 * whether the doctor works today, how many slots are still free, the working
 * hours and the remaining slot times.
 */
async function withTodayAvailability(doctorCards) {
  if (!doctorCards.length) return doctorCards;

  const today = todayString();
  const schedules = await scheduleModel.listAvailableForDay(dayNameFromDate(today));
  const scheduleByDoctor = new Map(schedules.map((row) => [Number(row.doctorId), row]));

  const bookedRows = await appointmentModel.bookedTimesByDoctorForDate(
    doctorCards.map((doctor) => doctor.id),
    today
  );
  const bookedByDoctor = new Map();
  for (const row of bookedRows) {
    const key = Number(row.doctorId);
    if (!bookedByDoctor.has(key)) bookedByDoctor.set(key, []);
    bookedByDoctor.get(key).push(row.time);
  }

  const cutoff = nowMinutes();

  return doctorCards.map((doctor) => {
    const schedule = scheduleByDoctor.get(Number(doctor.id));
    if (!schedule) {
      return { ...doctor, worksToday: false, todaySlotCount: 0, todayTimings: null, todaySlots: [] };
    }
    const slots = buildSlots({
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      booked: bookedByDoctor.get(Number(doctor.id)) || [],
      cutoffMinutes: cutoff,
    });
    return {
      ...doctor,
      worksToday: true,
      todaySlotCount: slots.length,
      todayTimings: `${toHHMM(schedule.startTime)} - ${toHHMM(schedule.endTime)}`,
      todaySlots: slots,
    };
  });
}

/** Public list of approved doctors with optional search/specialization filters. */
async function listDoctors(filters = {}) {
  const rows = await doctorModel.list({
    search: filters.search,
    specializationId: filters.specializationId,
    onlyApproved: true,
  });
  return withTodayAvailability(rows.map(toDoctorCard));
}

async function listSpecializations() {
  const rows = await specializationModel.list();
  return rows.map(toSpecialization);
}

/** Full doctor profile including their weekly schedule and today's availability. */
async function getDoctorDetail(id) {
  const doctor = await doctorModel.findById(id);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found.');
  }
  const schedules = await scheduleModel.listByDoctorId(doctor.id);
  const [card] = await withTodayAvailability([toDoctorCard(doctor)]);
  return { ...card, schedules: schedules.map(toSchedule) };
}

async function getProfile(userId) {
  const doctor = await doctorModel.findByUserId(userId);
  if (!doctor) {
    throw ApiError.notFound('Doctor profile not found.');
  }
  return toDoctorCard(doctor);
}

async function updateProfile(userId, data) {
  const doctor = await doctorModel.findByUserId(userId);
  if (!doctor) {
    throw ApiError.notFound('Doctor profile not found.');
  }

  await userModel.update(userId, { name: data.name, phone: data.phone });
  await doctorModel.updateByUserId(userId, {
    specializationId: data.specializationId,
    qualification: data.qualification,
    experience: data.experience,
    consultationFee: data.consultationFee,
    bio: data.bio,
  });

  return getProfile(userId);
}

async function getSchedule(doctorId) {
  const doctor = await doctorModel.findById(doctorId);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found.');
  }
  const rows = await scheduleModel.listByDoctorId(doctorId);
  return rows.map(toSchedule);
}

/** Replaces the whole weekly schedule for the logged-in doctor. */
async function saveSchedule(userId, schedules) {
  const doctor = await doctorModel.findByUserId(userId);
  if (!doctor) {
    throw ApiError.notFound('Doctor profile not found.');
  }

  const seen = new Set();
  for (const slot of schedules) {
    if (!DAY_NAMES.includes(slot.day)) {
      throw ApiError.badRequest(`Invalid day: ${slot.day}`);
    }
    if (seen.has(slot.day)) {
      throw ApiError.badRequest(`Duplicate day in schedule: ${slot.day}`);
    }
    seen.add(slot.day);

    if (toMinutes(slot.startTime) >= toMinutes(slot.endTime)) {
      throw ApiError.badRequest(`End time must be after start time on ${slot.day}.`);
    }
  }

  const rows = await scheduleModel.replaceForDoctor(doctor.id, schedules);
  return rows.map(toSchedule);
}

/**
 * Generates the bookable time slots for a doctor on a given date.
 * Slots are derived from the doctor's weekly schedule, excluding times that
 * are already booked (non-cancelled) and, for today, times that already passed.
 */
async function getAvailableSlots(doctorId, date) {
  const doctor = await doctorModel.findById(doctorId);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found.');
  }

  const day = dayNameFromDate(date);
  const schedule = await scheduleModel.findByDoctorAndDay(doctor.id, day);
  if (!schedule || !Number(schedule.available)) {
    return [];
  }

  const booked = await appointmentModel.bookedTimesForDate(doctor.id, date);
  const isToday = date === todayString();

  return buildSlots({
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    booked,
    cutoffMinutes: isToday ? nowMinutes() : -1,
  });
}

module.exports = {
  listDoctors,
  listSpecializations,
  getDoctorDetail,
  getProfile,
  updateProfile,
  getSchedule,
  saveSchedule,
  getAvailableSlots,
};

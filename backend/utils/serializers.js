/**
 * Maps raw database rows (snake_case aliased to camelCase in the models)
 * into the exact JSON shapes the frontend expects.
 */

function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt,
  };
}

function toPatient(row) {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    address: row.address,
    medicalHistory: row.medicalHistory,
    status: row.userStatus,
    createdAt: row.createdAt,
  };
}

function toDoctorCard(row) {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    specialization: row.specializationId
      ? { id: row.specializationId, name: row.specializationName }
      : null,
    qualification: row.qualification,
    experience: row.experience,
    consultationFee: Number(row.consultationFee || 0),
    bio: row.bio,
    status: row.status,
    available: Number(row.activeSchedules || 0) > 0,
    createdAt: row.createdAt,
  };
}

function toAppointment(row) {
  return {
    id: row.id,
    patientId: row.patientId,
    doctorId: row.doctorId,
    patientName: row.patientName,
    patientPhone: row.patientPhone,
    doctorName: row.doctorName,
    specializationName: row.specializationName,
    appointmentDate: row.appointmentDate,
    appointmentTime: String(row.appointmentTime || '').slice(0, 5),
    reason: row.reason,
    status: row.status,
    paymentStatus: row.paymentStatus || 'unpaid',
    paymentMethod: row.paymentMethod || null,
    amount: Number(row.amount || 0),
    consultationFee: Number(row.consultationFee || 0),
    paymentReference: row.paymentReference || null,
    paidAt: row.paidAt || null,
    createdAt: row.createdAt,
  };
}

function toSpecialization(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    doctorCount: row.doctorCount !== undefined ? Number(row.doctorCount) : undefined,
    createdAt: row.createdAt,
  };
}

function toSchedule(row) {
  return {
    id: row.id,
    doctorId: row.doctorId,
    day: row.day,
    startTime: String(row.startTime || '').slice(0, 5),
    endTime: String(row.endTime || '').slice(0, 5),
    available: Boolean(row.available),
  };
}

module.exports = { toUser, toPatient, toDoctorCard, toAppointment, toSpecialization, toSchedule };

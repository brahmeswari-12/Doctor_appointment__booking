const { pool } = require('../config/db');

const SELECT = `
  SELECT a.id,
         a.patient_id AS patientId,
         a.doctor_id AS doctorId,
         a.appointment_date AS appointmentDate,
         a.appointment_time AS appointmentTime,
         a.reason,
         a.status,
         a.payment_status    AS paymentStatus,
         a.payment_method    AS paymentMethod,
         a.amount,
         a.payment_reference AS paymentReference,
         a.paid_at           AS paidAt,
         a.created_at AS createdAt,
         a.updated_at AS updatedAt,
         pu.name AS patientName,
         pu.phone AS patientPhone,
         du.name AS doctorName,
         s.name AS specializationName,
         d.consultation_fee AS consultationFee
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN users pu ON pu.id = p.user_id
  JOIN doctors d ON d.id = a.doctor_id
  JOIN users du ON du.id = d.user_id
  LEFT JOIN specializations s ON s.id = d.specialization_id`;

async function create({ patientId, doctorId, appointmentDate, appointmentTime, reason = null }) {
  const [result] = await pool.query(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [patientId, doctorId, appointmentDate, appointmentTime, reason]
  );
  return result.insertId;
}

async function findById(id) {
  const [rows] = await pool.query(`${SELECT} WHERE a.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function list(filters = {}) {
  const { patientId, doctorId, status, date, filter, paymentStatus } = filters;
  const where = [];
  const values = [];

  if (patientId) { where.push('a.patient_id = ?'); values.push(patientId); }
  if (doctorId) { where.push('a.doctor_id = ?'); values.push(doctorId); }
  if (status) { where.push('a.status = ?'); values.push(status); }
  if (date) { where.push('a.appointment_date = ?'); values.push(date); }
  if (paymentStatus) { where.push('a.payment_status = ?'); values.push(paymentStatus); }

  if (filter === 'today') {
    where.push('a.appointment_date = CURDATE()');
  } else if (filter === 'upcoming') {
    where.push("a.appointment_date >= CURDATE() AND a.status NOT IN ('completed','cancelled')");
  } else if (filter === 'past') {
    where.push("(a.appointment_date < CURDATE() OR a.status IN ('completed','cancelled'))");
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `${SELECT} ${clause} ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    values
  );
  return rows;
}

/** Returns an existing active (non-cancelled) booking for the same doctor/date/time. */
async function findConflict({ doctorId, appointmentDate, appointmentTime, excludeId = null }) {
  const where = [
    'doctor_id = ?',
    'appointment_date = ?',
    'appointment_time = ?',
    "status <> 'cancelled'",
  ];
  const values = [doctorId, appointmentDate, appointmentTime];
  if (excludeId) {
    where.push('id <> ?');
    values.push(excludeId);
  }
  const [rows] = await pool.query(
    `SELECT id FROM appointments WHERE ${where.join(' AND ')} LIMIT 1`,
    values
  );
  return rows[0] || null;
}

async function updateStatus(id, status) {
  await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
}

async function reschedule(id, { appointmentDate, appointmentTime, reason }) {
  const fields = [];
  const values = [];
  if (appointmentDate !== undefined) { fields.push('appointment_date = ?'); values.push(appointmentDate); }
  if (appointmentTime !== undefined) { fields.push('appointment_time = ?'); values.push(appointmentTime); }
  if (reason !== undefined) { fields.push('reason = ?'); values.push(reason); }
  if (!fields.length) return;

  values.push(id);
  await pool.query(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`, values);
}

async function remove(id) {
  await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
}

async function countByStatus() {
  const [rows] = await pool.query(
    'SELECT status, COUNT(*) AS total FROM appointments GROUP BY status'
  );
  return rows.reduce((acc, row) => ({ ...acc, [row.status]: row.total }), {});
}

async function bookedTimesForDate(doctorId, date) {
  const [rows] = await pool.query(
    `SELECT TIME_FORMAT(appointment_time, '%H:%i') AS time
     FROM appointments
     WHERE doctor_id = ? AND appointment_date = ? AND status <> 'cancelled'`,
    [doctorId, date]
  );
  return rows.map((row) => row.time);
}

/** Booked times for many doctors on one date, as { doctorId, time } rows. */
async function bookedTimesByDoctorForDate(doctorIds, date) {
  if (!doctorIds.length) return [];
  const [rows] = await pool.query(
    `SELECT doctor_id AS doctorId, TIME_FORMAT(appointment_time, '%H:%i') AS time
     FROM appointments
     WHERE doctor_id IN (?) AND appointment_date = ? AND status <> 'cancelled'`,
    [doctorIds, date]
  );
  return rows;
}

/** Updates the payment fields of a single appointment. */
async function updatePayment(id, { paymentStatus, paymentMethod, amount, paymentReference, paidAt }) {
  const fields = [];
  const values = [];

  if (paymentStatus !== undefined) { fields.push('payment_status = ?'); values.push(paymentStatus); }
  if (paymentMethod !== undefined) { fields.push('payment_method = ?'); values.push(paymentMethod); }
  if (amount !== undefined) { fields.push('amount = ?'); values.push(amount); }
  if (paymentReference !== undefined) { fields.push('payment_reference = ?'); values.push(paymentReference); }
  if (paidAt !== undefined) { fields.push('paid_at = ?'); values.push(paidAt); }
  if (!fields.length) return;

  values.push(id);
  await pool.query(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`, values);
}

/** Payment side of the admin statistics. */
async function countPaymentStats() {
  const [rows] = await pool.query(
    `SELECT
        SUM(payment_status = 'paid')    AS paid,
        SUM(payment_status = 'unpaid')  AS unpaid,
        SUM(payment_status = 'refunded') AS refunded,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) AS revenue
     FROM appointments`
  );
  const row = rows[0] || {};
  return {
    paid: Number(row.paid || 0),
    unpaid: Number(row.unpaid || 0),
    refunded: Number(row.refunded || 0),
    revenue: Number(row.revenue || 0),
  };
}

module.exports = {
  create,
  findById,
  list,
  findConflict,
  updateStatus,
  reschedule,
  remove,
  countByStatus,
  countPaymentStats,
  bookedTimesForDate,
  bookedTimesByDoctorForDate,
  updatePayment,
};

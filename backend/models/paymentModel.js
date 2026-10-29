const { pool } = require('../config/db');

const SELECT = `
  SELECT id,
         appointment_id      AS appointmentId,
         patient_id          AS patientId,
         provider,
         method,
         amount,
         currency,
         status,
         provider_order_id   AS providerOrderId,
         provider_payment_id AS providerPaymentId,
         failure_reason      AS failureReason,
         created_at          AS createdAt,
         updated_at          AS updatedAt
  FROM payments`;

async function create({
  appointmentId,
  patientId,
  provider,
  method,
  amount,
  currency,
  status = 'created',
  providerOrderId = null,
}) {
  const [result] = await pool.query(
    `INSERT INTO payments
       (appointment_id, patient_id, provider, method, amount, currency, status, provider_order_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [appointmentId, patientId, provider, method, amount, currency, status, providerOrderId]
  );
  return result.insertId;
}

async function findById(id) {
  const [rows] = await pool.query(`${SELECT} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByOrderId(orderId) {
  if (!orderId) return null;
  const [rows] = await pool.query(`${SELECT} WHERE provider_order_id = ? LIMIT 1`, [orderId]);
  return rows[0] || null;
}

async function findLatestForAppointment(appointmentId) {
  const [rows] = await pool.query(
    `${SELECT} WHERE appointment_id = ? ORDER BY id DESC LIMIT 1`,
    [appointmentId]
  );
  return rows[0] || null;
}

async function updateStatus(id, { status, providerPaymentId, failureReason }) {
  const fields = ['status = ?'];
  const values = [status];

  if (providerPaymentId !== undefined) {
    fields.push('provider_payment_id = ?');
    values.push(providerPaymentId);
  }
  if (failureReason !== undefined) {
    fields.push('failure_reason = ?');
    values.push(failureReason);
  }

  values.push(id);
  await pool.query(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?`, values);
}

/** Marks every settled payment for an appointment as refunded. */
async function markRefundedForAppointment(appointmentId) {
  await pool.query(
    "UPDATE payments SET status = 'refunded' WHERE appointment_id = ? AND status = 'paid'",
    [appointmentId]
  );
}

/** Number of settled payments and the revenue they represent. */
async function sumPaid() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS revenue
     FROM payments
     WHERE status = 'paid'`
  );
  const row = rows[0] || {};
  return { total: Number(row.total || 0), revenue: Number(row.revenue || 0) };
}

module.exports = {
  create,
  findById,
  findByOrderId,
  findLatestForAppointment,
  updateStatus,
  markRefundedForAppointment,
  sumPaid,
};

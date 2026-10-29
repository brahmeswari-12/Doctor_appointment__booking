const { pool } = require('../config/db');

async function listByDoctorId(doctorId) {
  const [rows] = await pool.query(
    `SELECT id, doctor_id AS doctorId, day, start_time AS startTime,
            end_time AS endTime, available
     FROM doctor_schedules
     WHERE doctor_id = ?
     ORDER BY FIELD(day,
       'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')`,
    [doctorId]
  );
  return rows;
}

/** All active schedules for a given weekday, across every doctor. */
async function listAvailableForDay(day) {
  const [rows] = await pool.query(
    `SELECT doctor_id AS doctorId, start_time AS startTime, end_time AS endTime
     FROM doctor_schedules
     WHERE day = ? AND available = 1`,
    [day]
  );
  return rows;
}

async function findByDoctorAndDay(doctorId, day) {
  const [rows] = await pool.query(
    `SELECT id, doctor_id AS doctorId, day, start_time AS startTime,
            end_time AS endTime, available
     FROM doctor_schedules
     WHERE doctor_id = ? AND day = ?
     LIMIT 1`,
    [doctorId, day]
  );
  return rows[0] || null;
}

/**
 * Replaces the full weekly schedule of a doctor inside a transaction,
 * so a partial save can never leave the schedule half-updated.
 */
async function replaceForDoctor(doctorId, schedules) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM doctor_schedules WHERE doctor_id = ?', [doctorId]);

    for (const slot of schedules) {
      await connection.query(
        `INSERT INTO doctor_schedules (doctor_id, day, start_time, end_time, available)
         VALUES (?, ?, ?, ?, ?)`,
        [doctorId, slot.day, slot.startTime, slot.endTime, slot.available ? 1 : 0]
      );
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return listByDoctorId(doctorId);
}

module.exports = { listByDoctorId, listAvailableForDay, findByDoctorAndDay, replaceForDoctor };

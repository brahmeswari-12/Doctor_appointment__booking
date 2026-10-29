const { pool } = require('../config/db');

const SELECT = `
  SELECT p.id,
         p.user_id AS userId,
         u.name,
         u.email,
         u.phone,
         u.status AS userStatus,
         p.date_of_birth AS dateOfBirth,
         p.gender,
         p.address,
         p.medical_history AS medicalHistory,
         p.created_at AS createdAt
  FROM patients p
  JOIN users u ON u.id = p.user_id`;

async function create({ userId, dateOfBirth = null, gender = 'other', address = null, medicalHistory = null }) {
  const [result] = await pool.query(
    `INSERT INTO patients (user_id, date_of_birth, gender, address, medical_history)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, dateOfBirth || null, gender, address, medicalHistory]
  );
  return result.insertId;
}

async function findByUserId(userId) {
  const [rows] = await pool.query(`${SELECT} WHERE p.user_id = ? LIMIT 1`, [userId]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(`${SELECT} WHERE p.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function updateByUserId(userId, data) {
  const columns = {
    dateOfBirth: 'date_of_birth',
    gender: 'gender',
    address: 'address',
    medicalHistory: 'medical_history',
  };
  const fields = [];
  const values = [];
  Object.entries(columns).forEach(([key, column]) => {
    if (data[key] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(data[key] === '' ? null : data[key]);
    }
  });
  if (!fields.length) return;

  values.push(userId);
  await pool.query(`UPDATE patients SET ${fields.join(', ')} WHERE user_id = ?`, values);
}

async function list({ search } = {}) {
  const where = [];
  const values = [];
  if (search) {
    where.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(`${SELECT} ${clause} ORDER BY p.created_at DESC`, values);
  return rows;
}

module.exports = { create, findByUserId, findById, updateByUserId, list };

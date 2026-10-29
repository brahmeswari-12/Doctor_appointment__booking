const { pool } = require('../config/db');

const PUBLIC_FIELDS = 'id, name, email, phone, role, status, created_at AS createdAt';

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email.toLowerCase()]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create({ name, email, phone, password, role }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
    [name, email.toLowerCase(), phone, password, role]
  );
  return result.insertId;
}

async function update(id, { name, phone, status }) {
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (!fields.length) return;

  values.push(id);
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
}

async function updatePassword(id, password) {
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [password, id]);
}

async function remove(id) {
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
}

async function list({ role, search } = {}) {
  const where = [];
  const values = [];
  if (role) {
    where.push('role = ?');
    values.push(role);
  }
  if (search) {
    where.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM users ${clause} ORDER BY created_at DESC`,
    values
  );
  return rows;
}

module.exports = { findByEmail, findById, create, update, updatePassword, remove, list };

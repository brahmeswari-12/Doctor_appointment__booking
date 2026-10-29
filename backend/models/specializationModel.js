const { pool } = require('../config/db');

async function list() {
  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.description, s.created_at AS createdAt,
            (SELECT COUNT(*) FROM doctors d WHERE d.specialization_id = s.id) AS doctorCount
     FROM specializations s
     ORDER BY s.name ASC`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, description, created_at AS createdAt FROM specializations WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function findByName(name) {
  const [rows] = await pool.query('SELECT id, name FROM specializations WHERE name = ? LIMIT 1', [name]);
  return rows[0] || null;
}

async function create({ name, description = null }) {
  const [result] = await pool.query(
    'INSERT INTO specializations (name, description) VALUES (?, ?)',
    [name, description]
  );
  return result.insertId;
}

async function update(id, { name, description }) {
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (!fields.length) return;

  values.push(id);
  await pool.query(`UPDATE specializations SET ${fields.join(', ')} WHERE id = ?`, values);
}

async function remove(id) {
  await pool.query('DELETE FROM specializations WHERE id = ?', [id]);
}

async function count() {
  const [[row]] = await pool.query('SELECT COUNT(*) AS total FROM specializations');
  return row.total;
}

module.exports = { list, findById, findByName, create, update, remove, count };

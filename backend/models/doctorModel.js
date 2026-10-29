const { pool } = require('../config/db');

const SELECT = `
  SELECT d.id,
         d.user_id AS userId,
         u.name,
         u.email,
         u.phone,
         u.status AS userStatus,
         d.specialization_id AS specializationId,
         s.name AS specializationName,
         d.qualification,
         d.experience,
         d.consultation_fee AS consultationFee,
         d.bio,
         d.status,
         d.created_at AS createdAt,
         (SELECT COUNT(*) FROM doctor_schedules ds
           WHERE ds.doctor_id = d.id AND ds.available = 1) AS activeSchedules
  FROM doctors d
  JOIN users u ON u.id = d.user_id
  LEFT JOIN specializations s ON s.id = d.specialization_id`;

async function create({
  userId,
  specializationId = null,
  qualification = null,
  experience = 0,
  consultationFee = 0,
  bio = null,
  status = 'pending',
}) {
  const [result] = await pool.query(
    `INSERT INTO doctors
       (user_id, specialization_id, qualification, experience, consultation_fee, bio, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, specializationId || null, qualification, experience, consultationFee, bio, status]
  );
  return result.insertId;
}

async function findByUserId(userId) {
  const [rows] = await pool.query(`${SELECT} WHERE d.user_id = ? LIMIT 1`, [userId]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(`${SELECT} WHERE d.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function list({ search, specializationId, status, onlyApproved } = {}) {
  const where = [];
  const values = [];

  if (onlyApproved) {
    where.push("d.status = 'approved'");
  } else if (status) {
    where.push('d.status = ?');
    values.push(status);
  }
  if (specializationId) {
    where.push('d.specialization_id = ?');
    values.push(specializationId);
  }
  if (search) {
    where.push('(u.name LIKE ? OR d.qualification LIKE ? OR s.name LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(`${SELECT} ${clause} ORDER BY u.name ASC`, values);
  return rows;
}

async function updateById(id, data) {
  await updateWhere('id = ?', [id], data);
}

async function updateByUserId(userId, data) {
  await updateWhere('user_id = ?', [userId], data);
}

async function updateWhere(whereClause, whereValues, data) {
  const columns = {
    specializationId: 'specialization_id',
    qualification: 'qualification',
    experience: 'experience',
    consultationFee: 'consultation_fee',
    bio: 'bio',
    status: 'status',
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

  values.push(...whereValues);
  await pool.query(`UPDATE doctors SET ${fields.join(', ')} WHERE ${whereClause}`, values);
}

async function remove(id) {
  await pool.query('DELETE FROM doctors WHERE id = ?', [id]);
}

async function countByStatus() {
  const [rows] = await pool.query(
    'SELECT status, COUNT(*) AS total FROM doctors GROUP BY status'
  );
  return rows.reduce((acc, row) => ({ ...acc, [row.status]: row.total }), {});
}

module.exports = {
  create,
  findByUserId,
  findById,
  list,
  updateById,
  updateByUserId,
  remove,
  countByStatus,
};

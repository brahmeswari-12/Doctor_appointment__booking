const crypto = require('crypto');
const { pool } = require('../config/db');
const userModel = require('../models/userModel');
const patientModel = require('../models/patientModel');
const doctorModel = require('../models/doctorModel');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const { toUser, toPatient, toDoctorCard } = require('../utils/serializers');

/** Loads the role-specific profile attached to a user (doctor/patient profile). */
async function buildProfile(user) {
  if (user.role === 'patient') {
    const patient = await patientModel.findByUserId(user.id);
    return patient ? toPatient(patient) : null;
  }
  if (user.role === 'doctor') {
    const doctor = await doctorModel.findByUserId(user.id);
    return doctor ? toDoctorCard(doctor) : null;
  }
  return null;
}

async function register(payload) {
  const { name, email, phone, password, role } = payload;

  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const hashedPassword = await hashPassword(password);
  const userId = await userModel.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role,
  });

  if (role === 'patient') {
    await patientModel.create({ userId });
  } else if (role === 'doctor') {
    await doctorModel.create({
      userId,
      specializationId: payload.specializationId || null,
      qualification: payload.qualification || null,
      experience: payload.experience || 0,
      consultationFee: payload.consultationFee || 0,
      bio: payload.bio || null,
      // New doctors must be approved by an admin before patients can book them.
      status: 'pending',
    });
  }

  const user = await userModel.findById(userId);
  const token = signToken({ id: user.id, role: user.role });
  return { token, user: toUser(user), profile: await buildProfile(user) };
}

async function login({ email, password }) {
  const record = await userModel.findByEmail(email);
  if (!record) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const isValid = await comparePassword(password, record.password);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (record.status !== 'active') {
    throw ApiError.forbidden('Your account has been deactivated. Please contact the administrator.');
  }

  const user = await userModel.findById(record.id);
  const token = signToken({ id: user.id, role: user.role });
  return { token, user: toUser(user), profile: await buildProfile(user) };
}

async function me(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  return { user: toUser(user), profile: await buildProfile(user) };
}

/**
 * Creates a single-use reset token valid for one hour.
 * The response never reveals whether the email exists.
 */
async function forgotPassword(email) {
  const genericMessage = 'If that email address is registered, a password reset link has been sent.';
  const user = await userModel.findByEmail(email);
  if (!user) {
    return { message: genericMessage };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
    [user.id, token, expiresAt]
  );

  // NOTE: in production this token is emailed. It is returned here only so the
  // flow is testable locally without an SMTP server configured.
  return { message: genericMessage, resetToken: token };
}

async function resetPassword({ token, password }) {
  const [rows] = await pool.query(
    'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1',
    [token]
  );
  const record = rows[0];
  if (!record) {
    throw ApiError.badRequest('This password reset link is invalid or has expired.');
  }

  const hashedPassword = await hashPassword(password);
  await userModel.updatePassword(record.user_id, hashedPassword);
  await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [record.id]);

  return { message: 'Your password has been reset successfully. You can now log in.' };
}

module.exports = { register, login, me, forgotPassword, resetPassword, buildProfile };

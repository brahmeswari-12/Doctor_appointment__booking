const { verifyToken } = require('../utils/jwt');
const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Validates the `Authorization: Bearer <token>` header, loads the user from the
 * database and attaches it to `req.user`. Also blocks deactivated accounts.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token is missing');
    }

    const token = header.slice(7).trim();
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, status FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (!rows.length) {
      throw ApiError.unauthorized('This account no longer exists');
    }

    const user = rows[0];
    if (user.status !== 'active') {
      throw ApiError.forbidden('Your account has been deactivated. Please contact the administrator.');
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { authenticate };

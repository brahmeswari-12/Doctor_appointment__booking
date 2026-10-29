const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/** Hashes a plain-text password with bcrypt. Never store the raw value. */
function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/** Compares a plain-text password against a stored bcrypt hash. */
function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

module.exports = { hashPassword, comparePassword };

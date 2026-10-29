/**
 * Cleans the database by removing all sample/seed doctors, patients,
 * appointments, and payments.
 * Leaves the database completely clean with only:
 * - 1 Admin account (admin@doccare.com / Admin@123)
 * - The medical specializations (so doctors can select a category)
 *
 * Usage: npm run db:clean
 */
require('dotenv').config();

const { pool } = require('../config/db');
const { hashPassword } = require('../utils/password');

async function clean() {
  console.log('[db:clean] Removing all sample/dummy data from database...');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Disable foreign key checks to safely truncate/delete
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Remove appointments, payments, schedules
    await connection.query('TRUNCATE TABLE payments');
    await connection.query('TRUNCATE TABLE appointments');
    await connection.query('TRUNCATE TABLE doctor_schedules');
    await connection.query('TRUNCATE TABLE doctors');
    await connection.query('TRUNCATE TABLE patients');
    await connection.query('TRUNCATE TABLE password_resets');

    // Remove all users except admin
    await connection.query("DELETE FROM users WHERE role != 'admin'");

    // Check if admin exists; if not, create clean admin
    const [adminRows] = await connection.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!adminRows.length) {
      const adminPasswordHash = await hashPassword('Admin@123');
      await connection.query(
        `INSERT INTO users (name, email, phone, password, role, status)
         VALUES (?, ?, ?, ?, 'admin', 'active')`,
        ['System Admin', 'admin@doccare.com', '+91 99999 99999', adminPasswordHash]
      );
      console.log('[db:clean] Created default admin account: admin@doccare.com / Admin@123');
    } else {
      console.log('[db:clean] Retained existing admin account.');
    }

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();

    console.log('[db:clean] Success! All static/dummy doctors, patients, and appointments have been removed.');
    console.log('[db:clean] Database is now 100% clean and ready for your real dynamic data.');
    console.log('           Admin login: admin@doccare.com / Admin@123');
  } catch (err) {
    await connection.rollback();
    console.error('[db:clean] Failed:', err.message);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

clean().catch((err) => {
  console.error('[db:clean] Error:', err);
  process.exit(1);
});


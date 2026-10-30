const express = require('express');
const { body } = require('express-validator');
const { pool } = require('../config/db');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * Public dynamic stats for home page hero
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [[doctors]] = await pool.query(
      "SELECT COUNT(*) AS count FROM doctors WHERE status = 'approved'"
    );
    const [[specializations]] = await pool.query(
      'SELECT COUNT(*) AS count FROM specializations'
    );
    const [[patients]] = await pool.query(
      'SELECT COUNT(*) AS count FROM patients'
    );
    const [[appointments]] = await pool.query(
      'SELECT COUNT(*) AS count FROM appointments'
    );

    res.json({
      success: true,
      data: {
        doctors: Number(doctors?.count || 0),
        specializations: Number(specializations?.count || 0),
        patients: Number(patients?.count || 0),
        appointments: Number(appointments?.count || 0),
      },
    });
  })
);

/**
 * Public dynamic contact message submission
 */
router.post(
  '/contact',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('subject').optional().trim(),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Ensure contact_messages table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(190) NOT NULL,
        subject VARCHAR(255) NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [result] = await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || '', message]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        message: 'Your message has been received! We will get back to you soon.',
      },
    });
  })
);

module.exports = router;


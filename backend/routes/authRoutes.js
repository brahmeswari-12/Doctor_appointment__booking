const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('A valid email address is required').normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== undefined && value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
    body('role').optional().isIn(['patient', 'doctor']).withMessage('Role must be either patient or doctor'),
    body('experience').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Experience must be a positive number'),
    body('consultationFee').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),
  ],
  validate,
  controller.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email address is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  controller.login
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('A valid email address is required')],
  validate,
  controller.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  validate,
  controller.resetPassword
);

router.get('/me', authenticate, controller.me);

module.exports = router;

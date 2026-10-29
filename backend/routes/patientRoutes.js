const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const controller = require('../controllers/patientController');

const router = express.Router();

// Every patient route requires an authenticated patient account.
router.use(authenticate, authorize('patient'));

router.get('/profile', controller.getProfile);

router.put(
  '/profile',
  [
    body('name').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('gender').optional({ values: 'falsy' }).isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  ],
  validate,
  controller.updateProfile
);

router.get('/appointments', controller.getAppointments);

module.exports = router;

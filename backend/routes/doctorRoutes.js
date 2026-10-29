const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const controller = require('../controllers/doctorController');

const router = express.Router();

/* ------------------------- Public (no auth needed) ------------------------ */

// Declared before `/:id` so it is never captured as an id.
router.get('/specializations', controller.listSpecializations);
router.get('/', controller.listDoctors);
router.get('/:id/schedule', controller.getSchedule);
router.get('/:id/slots', controller.getSlots);
router.get('/:id', controller.getDoctorDetail);

/* ------------------------- Doctor only (private) ------------------------- */

router.put(
  '/profile',
  authenticate,
  authorize('doctor'),
  [
    body('name').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('experience').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Experience must be a positive number'),
    body('consultationFee').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),
  ],
  validate,
  controller.updateProfile
);

router.put(
  '/schedule',
  authenticate,
  authorize('doctor'),
  [
    body('schedules').isArray({ min: 1 }).withMessage('At least one schedule entry is required'),
    body('schedules.*.day').notEmpty().withMessage('Each schedule entry needs a day'),
    body('schedules.*.startTime').matches(/^\d{2}:\d{2}/).withMessage('Each schedule entry needs a valid start time'),
    body('schedules.*.endTime').matches(/^\d{2}:\d{2}/).withMessage('Each schedule entry needs a valid end time'),
  ],
  validate,
  controller.saveSchedule
);

module.exports = router;

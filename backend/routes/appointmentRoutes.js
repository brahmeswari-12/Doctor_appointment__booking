const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const controller = require('../controllers/appointmentController');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('doctorId').isInt({ min: 1 }).withMessage('A valid doctor is required'),
    body('appointmentDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Appointment date must be YYYY-MM-DD'),
    body('appointmentTime').matches(/^\d{2}:\d{2}/).withMessage('Appointment time must be HH:MM'),
    body('reason').optional().isString(),
  ],
  validate,
  controller.create
);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;

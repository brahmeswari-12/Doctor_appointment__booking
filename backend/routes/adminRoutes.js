const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const controller = require('../controllers/adminController');

const router = express.Router();

// The whole admin area is locked to the admin role.
router.use(authenticate, authorize('admin'));

/* --------------------------------- Stats -------------------------------- */
router.get('/stats', controller.getStats);

/* --------------------------------- Users -------------------------------- */
router.get('/users', controller.listUsers);
router.get('/patients', controller.listPatients);
router.put(
  '/users/:id/status',
  [body('status').isIn(['active', 'inactive']).withMessage('Status must be active or inactive')],
  validate,
  controller.setUserStatus
);
router.delete('/users/:id', controller.deleteUser);

/* -------------------------------- Doctors ------------------------------- */
router.get('/doctors', controller.listDoctors);
router.post(
  '/doctors',
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('A valid email address is required').normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('specializationId').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Invalid specialization'),
    body('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid doctor status'),
  ],
  validate,
  controller.createDoctor
);
router.put('/doctors/:id', controller.updateDoctor);
router.put(
  '/doctors/:id/approve',
  [body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')],
  validate,
  controller.approveDoctor
);
router.delete('/doctors/:id', controller.deleteDoctor);

/* ----------------------------- Appointments ----------------------------- */
router.get('/appointments', controller.listAppointments);

/* ---------------------------- Specializations --------------------------- */
router.get('/specializations', controller.listSpecializations);
router.post(
  '/specializations',
  [body('name').trim().notEmpty().withMessage('Specialization name is required')],
  validate,
  controller.createSpecialization
);
router.put(
  '/specializations/:id',
  [body('name').trim().notEmpty().withMessage('Specialization name is required')],
  validate,
  controller.updateSpecialization
);
router.delete('/specializations/:id', controller.deleteSpecialization);

module.exports = router;

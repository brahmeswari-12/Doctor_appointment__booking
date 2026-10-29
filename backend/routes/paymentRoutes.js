const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const controller = require('../controllers/paymentController');

const router = express.Router();

router.use(authenticate);

router.get('/config', controller.config);

router.post(
  '/orders',
  [
    body('appointmentId').isInt({ min: 1 }).withMessage('A valid appointment is required'),
    body('method')
      .isIn(['cash', 'card', 'upi', 'netbanking', 'wallet'])
      .withMessage('Unsupported payment method'),
  ],
  validate,
  controller.createOrder
);

router.post(
  '/verify',
  [
    body('appointmentId').isInt({ min: 1 }).withMessage('A valid appointment is required'),
    body('orderId').isString().notEmpty().withMessage('A payment order is required'),
  ],
  validate,
  controller.verify
);

router.post(
  '/fail',
  [
    body('appointmentId').isInt({ min: 1 }).withMessage('A valid appointment is required'),
    body('orderId').isString().notEmpty().withMessage('A payment order is required'),
  ],
  validate,
  controller.fail
);

module.exports = router;

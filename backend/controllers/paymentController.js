const paymentService = require('../services/paymentService');
const asyncHandler = require('../utils/asyncHandler');

const config = asyncHandler(async (req, res) => {
  res.json({ success: true, data: paymentService.getConfig() });
});

const createOrder = asyncHandler(async (req, res) => {
  const data = await paymentService.createOrder(req.user, {
    appointmentId: Number(req.body.appointmentId),
    method: req.body.method,
  });
  res.status(201).json({ success: true, data });
});

const verify = asyncHandler(async (req, res) => {
  const data = await paymentService.verifyPayment(req.user, {
    appointmentId: Number(req.body.appointmentId),
    orderId: req.body.orderId,
    paymentId: req.body.paymentId,
    signature: req.body.signature,
  });
  res.json({ success: true, data });
});

const fail = asyncHandler(async (req, res) => {
  const data = await paymentService.failPayment(req.user, {
    appointmentId: Number(req.body.appointmentId),
    orderId: req.body.orderId,
    reason: req.body.reason,
  });
  res.json({ success: true, data });
});

module.exports = { config, createOrder, verify, fail };

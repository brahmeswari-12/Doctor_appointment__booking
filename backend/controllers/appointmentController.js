const appointmentService = require('../services/appointmentService');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const data = await appointmentService.createAppointment(req.user, req.body);
  res.status(201).json({ success: true, data });
});

const list = asyncHandler(async (req, res) => {
  const data = await appointmentService.listAppointments(req.user, {
    status: req.query.status,
    paymentStatus: req.query.paymentStatus,
    filter: req.query.filter,
    date: req.query.date,
  });
  res.json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await appointmentService.getAppointment(req.user, req.params.id);
  res.json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const data = await appointmentService.updateAppointment(req.user, req.params.id, req.body);
  res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  const data = await appointmentService.deleteAppointment(req.user, req.params.id);
  res.json({ success: true, data });
});

module.exports = { create, list, getById, update, remove };

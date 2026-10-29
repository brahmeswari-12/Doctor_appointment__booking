const patientService = require('../services/patientService');
const asyncHandler = require('../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  const data = await patientService.getProfile(req.user.id);
  res.json({ success: true, data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const data = await patientService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data });
});

const getAppointments = asyncHandler(async (req, res) => {
  const data = await patientService.getAppointments(req.user.id, {
    status: req.query.status,
    filter: req.query.filter,
  });
  res.json({ success: true, data });
});

module.exports = { getProfile, updateProfile, getAppointments };

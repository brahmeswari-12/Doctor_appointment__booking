const doctorService = require('../services/doctorService');
const asyncHandler = require('../utils/asyncHandler');

/* ------------------------------- Public ------------------------------- */

const listDoctors = asyncHandler(async (req, res) => {
  const data = await doctorService.listDoctors({
    search: req.query.search,
    specializationId: req.query.specializationId,
  });
  res.json({ success: true, data });
});

const listSpecializations = asyncHandler(async (req, res) => {
  const data = await doctorService.listSpecializations();
  res.json({ success: true, data });
});

const getDoctorDetail = asyncHandler(async (req, res) => {
  const data = await doctorService.getDoctorDetail(req.params.id);
  res.json({ success: true, data });
});

const getSchedule = asyncHandler(async (req, res) => {
  const data = await doctorService.getSchedule(req.params.id);
  res.json({ success: true, data });
});

const getSlots = asyncHandler(async (req, res) => {
  const data = await doctorService.getAvailableSlots(req.params.id, req.query.date);
  res.json({ success: true, data });
});

/* --------------------------- Doctor (private) -------------------------- */

const getProfile = asyncHandler(async (req, res) => {
  const data = await doctorService.getProfile(req.user.id);
  res.json({ success: true, data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const data = await doctorService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data });
});

const saveSchedule = asyncHandler(async (req, res) => {
  const data = await doctorService.saveSchedule(req.user.id, req.body.schedules);
  res.json({ success: true, data });
});

module.exports = {
  listDoctors,
  listSpecializations,
  getDoctorDetail,
  getSchedule,
  getSlots,
  getProfile,
  updateProfile,
  saveSchedule,
};

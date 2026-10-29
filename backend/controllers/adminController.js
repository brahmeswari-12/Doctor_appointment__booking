const adminService = require('../services/adminService');
const asyncHandler = require('../utils/asyncHandler');

const getStats = asyncHandler(async (req, res) => {
  const data = await adminService.getStats();
  res.json({ success: true, data });
});

const listUsers = asyncHandler(async (req, res) => {
  const data = await adminService.listUsers({ role: req.query.role, search: req.query.search });
  res.json({ success: true, data });
});

const listPatients = asyncHandler(async (req, res) => {
  const data = await adminService.listPatients({ search: req.query.search });
  res.json({ success: true, data });
});

const listDoctors = asyncHandler(async (req, res) => {
  const data = await adminService.listDoctors({ search: req.query.search, status: req.query.status });
  res.json({ success: true, data });
});

const listAppointments = asyncHandler(async (req, res) => {
  const data = await adminService.listAppointments({
    status: req.query.status,
    paymentStatus: req.query.paymentStatus,
    date: req.query.date,
    doctorId: req.query.doctorId,
    patientId: req.query.patientId,
  });
  res.json({ success: true, data });
});

const createDoctor = asyncHandler(async (req, res) => {
  const data = await adminService.createDoctor(req.body);
  res.status(201).json({ success: true, data });
});

const updateDoctor = asyncHandler(async (req, res) => {
  const data = await adminService.updateDoctor(req.params.id, req.body);
  res.json({ success: true, data });
});

const deleteDoctor = asyncHandler(async (req, res) => {
  const data = await adminService.deleteDoctor(req.params.id);
  res.json({ success: true, data });
});

const approveDoctor = asyncHandler(async (req, res) => {
  const data = await adminService.approveDoctor(req.params.id, req.body.status);
  res.json({ success: true, data });
});

const setUserStatus = asyncHandler(async (req, res) => {
  const data = await adminService.setUserStatus(req.params.id, req.body.status);
  res.json({ success: true, data });
});

const deleteUser = asyncHandler(async (req, res) => {
  const data = await adminService.deleteUser(req.params.id);
  res.json({ success: true, data });
});

const listSpecializations = asyncHandler(async (req, res) => {
  const data = await adminService.listSpecializations();
  res.json({ success: true, data });
});

const createSpecialization = asyncHandler(async (req, res) => {
  const data = await adminService.createSpecialization(req.body);
  res.status(201).json({ success: true, data });
});

const updateSpecialization = asyncHandler(async (req, res) => {
  const data = await adminService.updateSpecialization(req.params.id, req.body);
  res.json({ success: true, data });
});

const deleteSpecialization = asyncHandler(async (req, res) => {
  const data = await adminService.deleteSpecialization(req.params.id);
  res.json({ success: true, data });
});

module.exports = {
  getStats,
  listUsers,
  listPatients,
  listDoctors,
  listAppointments,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  approveDoctor,
  setUserStatus,
  deleteUser,
  listSpecializations,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
};

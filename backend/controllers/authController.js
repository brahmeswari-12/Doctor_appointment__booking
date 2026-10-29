const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const data = await authService.register({ role: 'patient', ...req.body });
  res.status(201).json({ success: true, data });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  res.json({ success: true, data });
});

const me = asyncHandler(async (req, res) => {
  const data = await authService.me(req.user.id);
  res.json({ success: true, data });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body.email);
  res.json({ success: true, data });
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  res.json({ success: true, data });
});

module.exports = { register, login, me, forgotPassword, resetPassword };

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Collects express-validator failures and forwards them as a single 422 error.
 * Place at the end of a route's validation chain, before the controller.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    return next(ApiError.unprocessable(message));
  }
  return next();
}

module.exports = { validate };

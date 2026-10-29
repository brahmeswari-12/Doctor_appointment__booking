const ApiError = require('../utils/ApiError');

/**
 * Role based access control. Usage: `authorize('admin')` or `authorize('doctor','admin')`.
 * Must run after `authenticate`.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource'));
    }
    return next();
  };
}

module.exports = { authorize };

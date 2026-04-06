const createError = require("../utils/createError");

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError("Unauthorized", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(createError("Access denied for this role", 403));
    }

    next();
  };
}

module.exports = roleMiddleware;

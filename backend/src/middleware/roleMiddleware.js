/**
 * Middleware factory to authorize user roles.
 * Must be executed AFTER authentication middleware has attached req.user.
 *
 * @param  {...string|string[]} roles - Allowed role(s) for the route
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (...roles) => {
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};

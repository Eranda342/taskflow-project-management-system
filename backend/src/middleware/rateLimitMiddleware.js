const rateLimit = require('express-rate-limit');

/**
 * Authentication rate limiter (protects login and registration from brute-force attempts)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Generous limit for local development & automated test suites
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

module.exports = {
  authLimiter,
};

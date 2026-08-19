const express = require('express');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const { authLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Public routes
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

module.exports = router;

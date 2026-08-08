const express = require('express');
const {
  registerUser,
  loginUser,
  getCurrentUser,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const { authLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Public routes
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

module.exports = router;

const express = require('express');
const {
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  updateOwnProfile,
  updatePassword,
} = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();

// Current user profile/password update (must precede /:userId route)
router.patch('/me/profile', authenticate, updateOwnProfile);
router.patch('/me/password', authenticate, updatePassword);

// Admin-only user management routes
router.get('/', authenticate, authorizeRoles(ROLES.ADMIN), getUsers);
router.get('/:userId', authenticate, authorizeRoles(ROLES.ADMIN), getUserById);
router.patch('/:userId/role', authenticate, authorizeRoles(ROLES.ADMIN), updateUserRole);
router.patch('/:userId/status', authenticate, authorizeRoles(ROLES.ADMIN), updateUserStatus);

module.exports = router;

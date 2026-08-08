const express = require('express');
const {
  getUserOperationalSummary,
  transferProjectOwnership,
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();

// Operational summary of user before deactivation/role changes
router.get(
  '/admin/users/:userId/summary',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  getUserOperationalSummary
);

// Project ownership transfer
router.patch(
  '/admin/projects/:projectId/owner',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  transferProjectOwnership
);

module.exports = router;

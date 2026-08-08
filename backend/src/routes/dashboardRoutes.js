const express = require('express');
const { getDashboard, getAdminStats } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();

// General role-scoped dashboard
router.get('/dashboard', authenticate, getDashboard);

// Admin-only platform statistics and analytics
router.get('/admin/stats', authenticate, authorizeRoles(ROLES.ADMIN), getAdminStats);

module.exports = router;

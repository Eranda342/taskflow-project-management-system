const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  createProject
);

router.get('/', authenticate, getProjects);

router.get('/:projectId', authenticate, getProjectById);

router.patch(
  '/:projectId',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  updateProject
);

router.delete(
  '/:projectId',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  deleteProject
);

module.exports = router;

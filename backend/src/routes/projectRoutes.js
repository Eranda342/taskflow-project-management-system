const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getMemberCandidates,
} = require('../controllers/projectController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();

// Project CRUD
router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  createProject
);

router.get('/', authenticate, getProjects);

// Member Candidate Search
router.get(
  '/:projectId/member-candidates',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  getMemberCandidates
);

// Member Management
router.get('/:projectId/members', authenticate, getProjectMembers);

router.post(
  '/:projectId/members',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  addProjectMember
);

router.delete(
  '/:projectId/members/:userId',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  removeProjectMember
);

// Single Project Access and Updates
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

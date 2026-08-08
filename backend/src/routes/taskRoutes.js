const express = require('express');
const {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();

// Project-nested task routes
router
  .route('/projects/:projectId/tasks')
  .post(
    authenticate,
    authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
    createTask
  )
  .get(authenticate, getProjectTasks);

// Direct task routes
router
  .route('/tasks/:taskId')
  .get(authenticate, getTaskById)
  .patch(
    authenticate,
    authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
    updateTask
  )
  .delete(
    authenticate,
    authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
    deleteTask
  );

module.exports = router;

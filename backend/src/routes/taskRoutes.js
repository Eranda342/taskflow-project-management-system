const express = require('express');
const {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  assignTask,
  updateTaskStatus,
  getMyTasks,
  deleteTask,
} = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();

// My tasks route (MUST come before /tasks/:taskId to prevent 'my' from matching as :taskId)
router.get('/tasks/my', authenticate, getMyTasks);

// Project-nested task routes
router
  .route('/projects/:projectId/tasks')
  .post(
    authenticate,
    authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
    createTask
  )
  .get(authenticate, getProjectTasks);

// Task assignment route (Admin & Project Manager route-level, controller checks project ownership)
router.patch(
  '/tasks/:taskId/assign',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  assignTask
);

// Task status route (All authenticated users at route-level, controller checks admin/owner/assigned user)
router.patch('/tasks/:taskId/status', authenticate, updateTaskStatus);

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

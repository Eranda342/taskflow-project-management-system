const express = require('express');
const {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Task comments endpoints
router.post('/tasks/:taskId/comments', authenticate, createComment);
router.get('/tasks/:taskId/comments', authenticate, getTaskComments);

// Comment management endpoints
router.patch('/comments/:commentId', authenticate, updateComment);
router.delete('/comments/:commentId', authenticate, deleteComment);

module.exports = router;

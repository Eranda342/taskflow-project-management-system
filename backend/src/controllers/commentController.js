const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { ROLES } = require('../utils/roles');
const { isProjectOwner, canViewProject } = require('../utils/projectAccess');
const { NOTIFICATION_TYPE } = require('../utils/notificationConstants');
const { createNotifications } = require('../services/notificationService');

// Field selection strings to prevent leaking sensitive fields (e.g., password)
const USER_POPULATE_FIELDS = 'name email role profileImage';

/**
 * @desc    Create a new comment on a task
 * @route   POST /api/tasks/:taskId/comments
 * @access  Private (Admin, Project Owner, Project Members)
 */
const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Authorization: Admin, Project Owner, or Project Member
    if (!canViewProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this task',
      });
    }

    const { message } = req.body;

    if (message === undefined || message === null || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment message is required',
      });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment message cannot exceed 2000 characters',
      });
    }

    // Server authoritatively sets task (from URL) and user (from authenticated token)
    const comment = await Comment.create({
      task: task._id,
      user: req.user._id,
      message: message.trim(),
    });

    // Notify project owner and task assignee (excluding comment author)
    await createNotifications({
      recipients: [project.owner, task.assignedTo],
      sender: req.user._id,
      type: NOTIFICATION_TYPE.COMMENT_ADDED,
      message: `New comment on task: ${task.title}`,
      referenceId: comment._id,
    });

    const populatedComment = await Comment.findById(comment._id).populate('user', USER_POPULATE_FIELDS);

    return res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        comment: populatedComment,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Get comments for a task (chronological order with pagination)
 * @route   GET /api/tasks/:taskId/comments
 * @access  Private (Admin, Project Owner, Project Members)
 */
const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Authorization: Admin, Project Owner, or Project Member
    if (!canViewProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this task',
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [comments, totalComments] = await Promise.all([
      Comment.find({ task: taskId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('user', USER_POPULATE_FIELDS),
      Comment.countDocuments({ task: taskId }),
    ]);

    const totalPages = Math.ceil(totalComments / limit) || 0;

    return res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          totalComments,
          totalPages,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Update a comment (Author only)
 * @route   PATCH /api/comments/:commentId
 * @access  Private (Comment Author only)
 */
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID',
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const task = await Task.findById(comment.task);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Must still have project access
    if (!canViewProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    // Only comment author may edit
    const authorId = (comment.user._id || comment.user).toString();
    if (authorId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this comment',
      });
    }

    const { message } = req.body;

    if (message === undefined || message === null || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment message is required',
      });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment message cannot exceed 2000 characters',
      });
    }

    comment.message = message.trim();
    await comment.save();

    const populatedComment = await Comment.findById(comment._id).populate('user', USER_POPULATE_FIELDS);

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment: populatedComment,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Delete a comment (Comment Author, Project Owner, or Admin)
 * @route   DELETE /api/comments/:commentId
 * @access  Private (Comment Author, Project Owner, Admin)
 */
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID',
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const task = await Task.findById(comment.task);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Must still have project access
    if (!canViewProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    // Authorization: Author, Project Owner, or Admin
    const authorId = (comment.user._id || comment.user).toString();
    const isAuthor = authorId === req.user._id.toString();
    const isOwner = isProjectOwner(project, req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isAuthor && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this comment',
      });
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
};

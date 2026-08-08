const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Comment = require('../models/Comment');
const {
  TASK_STATUS,
  TASK_STATUS_LIST,
  TASK_PRIORITY,
  TASK_PRIORITY_LIST,
} = require('../utils/taskConstants');
const {
  isProjectOwner,
  isProjectMember,
  canViewProject,
  canManageProject,
} = require('../utils/projectAccess');
const { ROLES } = require('../utils/roles');

const USER_POPULATE_FIELDS = '_id name email role profileImage';
const PROJECT_POPULATE_FIELDS = '_id name status deadline';

/**
 * @desc    Create a new task in a project
 * @route   POST /api/projects/:projectId/tasks
 * @access  Private (Admin & Project Owner only)
 */
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID',
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Only project owner or admin can create tasks
    if (!canManageProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or an admin can create tasks in this project',
      });
    }

    const { title, description, priority, dueDate } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Task title cannot exceed 200 characters',
      });
    }

    // Validate description if provided
    let cleanDescription = '';
    if (description !== undefined) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Task description must be a string',
        });
      }
      if (description.trim().length > 3000) {
        return res.status(400).json({
          success: false,
          message: 'Task description cannot exceed 3000 characters',
        });
      }
      cleanDescription = description.trim();
    }

    // Validate priority if provided
    let cleanPriority = TASK_PRIORITY.MEDIUM;
    if (priority !== undefined) {
      if (!TASK_PRIORITY_LIST.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task priority',
        });
      }
      cleanPriority = priority;
    }

    // Validate dueDate if provided
    let cleanDueDate = null;
    if (dueDate !== undefined && dueDate !== null && dueDate !== '') {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date format',
        });
      }
      cleanDueDate = parsedDate;
    }

    // Server-controlled values
    const task = await Task.create({
      title: title.trim(),
      description: cleanDescription,
      project: project._id,
      createdBy: req.user._id,
      assignedTo: null,
      priority: cleanPriority,
      status: TASK_STATUS.TODO,
      dueDate: cleanDueDate,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', USER_POPULATE_FIELDS)
      .populate('assignedTo', USER_POPULATE_FIELDS)
      .populate('project', PROJECT_POPULATE_FIELDS);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: populatedTask,
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
 * @desc    Get all tasks in a project with filtering, search, and pagination
 * @route   GET /api/projects/:projectId/tasks
 * @access  Private (Admin, Project Owner, Project Members)
 */
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID',
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Authorization: Admin, Owner, or Member
    if (!canViewProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { project: project._id };

    // Search by title or description
    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const escapedSearch = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Filter by status
    if (req.query.status !== undefined) {
      if (!TASK_STATUS_LIST.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task status filter',
        });
      }
      filter.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority !== undefined) {
      if (!TASK_PRIORITY_LIST.includes(req.query.priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task priority filter',
        });
      }
      filter.priority = req.query.priority;
    }

    const [tasks, totalTasks] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', USER_POPULATE_FIELDS)
        .populate('assignedTo', USER_POPULATE_FIELDS)
        .populate('project', PROJECT_POPULATE_FIELDS),
      Task.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalTasks / limit);

    return res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          page,
          limit,
          totalTasks,
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
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:taskId
 * @access  Private (Admin, Project Owner, Project Members)
 */
const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    const task = await Task.findById(taskId)
      .populate('createdBy', USER_POPULATE_FIELDS)
      .populate('assignedTo', USER_POPULATE_FIELDS)
      .populate('project', PROJECT_POPULATE_FIELDS);

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

    // Access check based on project membership/ownership
    if (!canViewProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this task',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        task,
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
 * @desc    Update task details (Admin & Project Owner only)
 * @route   PATCH /api/tasks/:taskId
 * @access  Private (Admin & Project Owner only)
 */
const updateTask = async (req, res) => {
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

    // Only project owner or admin can update tasks
    if (!canManageProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or an admin can update this task',
      });
    }

    const { title, description, priority, dueDate } = req.body;
    let hasUpdates = false;

    // Validate and apply title
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task title cannot be empty',
        });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Task title cannot exceed 200 characters',
        });
      }
      task.title = title.trim();
      hasUpdates = true;
    }

    // Validate and apply description
    if (description !== undefined) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Task description must be a string',
        });
      }
      if (description.trim().length > 3000) {
        return res.status(400).json({
          success: false,
          message: 'Task description cannot exceed 3000 characters',
        });
      }
      task.description = description.trim();
      hasUpdates = true;
    }

    // Validate and apply priority
    if (priority !== undefined) {
      if (!TASK_PRIORITY_LIST.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task priority',
        });
      }
      task.priority = priority;
      hasUpdates = true;
    }

    // Validate and apply dueDate
    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        task.dueDate = null;
      } else {
        const parsedDate = new Date(dueDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid due date format',
          });
        }
        task.dueDate = parsedDate;
      }
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return res.status(400).json({
        success: false,
        message: 'No valid task fields provided for update',
      });
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('createdBy', USER_POPULATE_FIELDS)
      .populate('assignedTo', USER_POPULATE_FIELDS)
      .populate('project', PROJECT_POPULATE_FIELDS);

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: updatedTask,
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
 * @desc    Assign or unassign a task (Admin & Project Owner only)
 * @route   PATCH /api/tasks/:taskId/assign
 * @access  Private (Admin & Project Owner only)
 */
const assignTask = async (req, res) => {
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

    // Only project owner or admin can manage task assignments
    if (!canManageProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or an admin can assign tasks in this project',
      });
    }

    const { userId } = req.body;

    // Handle Unassignment
    if (userId === null) {
      task.assignedTo = null;
      await task.save();

      const populatedTask = await Task.findById(task._id)
        .populate('createdBy', USER_POPULATE_FIELDS)
        .populate('assignedTo', USER_POPULATE_FIELDS)
        .populate('project', PROJECT_POPULATE_FIELDS);

      return res.status(200).json({
        success: true,
        message: 'Task unassigned successfully',
        data: {
          task: populatedTask,
        },
      });
    }

    // Validate userId for assignment
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const targetUser = await User.findById(userId.trim());

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (targetUser.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Inactive users cannot be assigned to tasks',
      });
    }

    if (!isProjectMember(project, targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'User must be a member of the project before being assigned a task',
      });
    }

    task.assignedTo = targetUser._id;
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', USER_POPULATE_FIELDS)
      .populate('assignedTo', USER_POPULATE_FIELDS)
      .populate('project', PROJECT_POPULATE_FIELDS);

    return res.status(200).json({
      success: true,
      message: 'Task assigned successfully',
      data: {
        task: populatedTask,
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
 * @desc    Update task status (Admin, Project Owner, or Assigned Member)
 * @route   PATCH /api/tasks/:taskId/status
 * @access  Private (Admin, Project Owner, or Assigned Member)
 */
const updateTaskStatus = async (req, res) => {
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

    // Permission check: Admin, Project Owner, or the assigned user
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOwner = isProjectOwner(project, req.user._id);
    const isAssignee =
      task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner && !isAssignee) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update the status of this task',
      });
    }

    const { status } = req.body;

    if (!status || typeof status !== 'string' || !TASK_STATUS_LIST.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task status',
      });
    }

    task.status = status;
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', USER_POPULATE_FIELDS)
      .populate('assignedTo', USER_POPULATE_FIELDS)
      .populate('project', PROJECT_POPULATE_FIELDS);

    return res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: {
        task: populatedTask,
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
 * @desc    Get tasks assigned to currently authenticated user
 * @route   GET /api/tasks/my
 * @access  Private (All authenticated active users)
 */
const getMyTasks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { assignedTo: req.user._id };

    // Search by title or description
    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const escapedSearch = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Filter by status
    if (req.query.status !== undefined) {
      if (!TASK_STATUS_LIST.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task status filter',
        });
      }
      filter.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority !== undefined) {
      if (!TASK_PRIORITY_LIST.includes(req.query.priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task priority filter',
        });
      }
      filter.priority = req.query.priority;
    }

    // Filter by project
    if (req.query.project !== undefined) {
      if (
        typeof req.query.project !== 'string' ||
        !mongoose.Types.ObjectId.isValid(req.query.project.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID filter',
        });
      }
      filter.project = req.query.project.trim();
    }

    const [tasks, totalTasks] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('project', PROJECT_POPULATE_FIELDS)
        .populate('assignedTo', USER_POPULATE_FIELDS)
        .populate('createdBy', USER_POPULATE_FIELDS),
      Task.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalTasks / limit);

    return res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          page,
          limit,
          totalTasks,
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
 * @desc    Delete task (Admin & Project Owner only)
 * @route   DELETE /api/tasks/:taskId
 * @access  Private (Admin & Project Owner only)
 */
const deleteTask = async (req, res) => {
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

    // Only project owner or admin can delete tasks
    if (!canManageProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or an admin can delete this task',
      });
    }

    // Cascade delete all comments belonging to this task
    await Comment.deleteMany({ task: taskId });

    await Task.findByIdAndDelete(taskId);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  assignTask,
  updateTaskStatus,
  getMyTasks,
  deleteTask,
};

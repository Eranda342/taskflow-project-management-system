const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { ROLES } = require('../utils/roles');
const { PROJECT_STATUS_LIST } = require('../utils/projectStatus');
const {
  isProjectOwner,
  isProjectMember,
  canViewProject,
  canManageProject,
} = require('../utils/projectAccess');
const { NOTIFICATION_TYPE } = require('../utils/notificationConstants');
const { createNotification } = require('../services/notificationService');
const {
  emitToProject,
  closeProjectRoom,
  addUserToProjectRoom,
  removeUserFromProjectRoom,
} = require('../socket/socketManager');
const { parsePagination, validateDates } = require('../utils/validation');

const USER_POPULATE_FIELDS = 'name email role status profileImage';

/**
 * Format a User object for member responses without sensitive fields
 * @param {Object} user
 * @returns {Object}
 */
const formatMember = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  profileImage: user.profileImage,
});

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Admin & Project Manager)
 */
const createProject = async (req, res) => {
  try {
    const { name, description, startDate, deadline, status } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    if (name.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Project name cannot exceed 150 characters',
      });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project description is required',
      });
    }

    if (description.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Project description cannot exceed 2000 characters',
      });
    }

    const dateCheck = validateDates(startDate, deadline);
    if (!dateCheck.valid) {
      return res.status(400).json({
        success: false,
        message: dateCheck.message,
      });
    }

    let projectStatus = 'planning';
    if (status !== undefined) {
      if (!PROJECT_STATUS_LIST.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project status',
        });
      }
      projectStatus = status;
    }

    // Owner and members are securely set by the server from req.user
    const project = await Project.create({
      name: name.trim(),
      description: description.trim(),
      owner: req.user._id,
      members: [req.user._id],
      startDate: startDate ? new Date(startDate) : null,
      deadline: deadline ? new Date(deadline) : null,
      status: projectStatus,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', USER_POPULATE_FIELDS)
      .populate('members', USER_POPULATE_FIELDS);

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: populatedProject,
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
 * @desc    Get all accessible projects based on user role
 * @route   GET /api/projects
 * @access  Private (All authenticated users)
 */
const getProjects = async (req, res) => {
  try {
    const pagination = parsePagination(req.query, 10, 100);
    if (!pagination.valid) {
      return res.status(400).json({
        success: false,
        message: pagination.message,
      });
    }
    const { page, limit, skip } = pagination;

    const query = {};

    // Role-based visibility scoping
    if (req.user.role === ROLES.PROJECT_MANAGER) {
      query.$or = [{ owner: req.user._id }, { members: req.user._id }];
    } else if (req.user.role === ROLES.TEAM_MEMBER) {
      query.members = req.user._id;
    }
    // Admin has no owner/member restriction and sees all projects

    // Search filter across name and description
    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const escapedSearch = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      const searchCondition = {
        $or: [{ name: searchRegex }, { description: searchRegex }],
      };

      if (query.$or) {
        query.$and = [{ $or: query.$or }, searchCondition];
        delete query.$or;
      } else {
        query.$or = searchCondition.$or;
      }
    }

    // Status filter
    if (req.query.status !== undefined) {
      if (!PROJECT_STATUS_LIST.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project status filter',
        });
      }
      query.status = req.query.status;
    }

    const [projects, totalProjects] = await Promise.all([
      Project.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', USER_POPULATE_FIELDS)
        .populate('members', USER_POPULATE_FIELDS),
      Project.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalProjects / limit);

    return res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          page,
          limit,
          totalProjects,
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
 * @desc    Get single project by ID with access check
 * @route   GET /api/projects/:projectId
 * @access  Private (All authenticated users with project access)
 */
const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID',
      });
    }

    const project = await Project.findById(projectId)
      .populate('owner', USER_POPULATE_FIELDS)
      .populate('members', USER_POPULATE_FIELDS);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (!canViewProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        project,
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
 * @desc    Update project (Resource owner or Admin)
 * @route   PATCH /api/projects/:projectId
 * @access  Private (Project Owner & Admin)
 */
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, startDate, deadline, status } = req.body;

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

    // Resource ownership authorization
    if (!canManageProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or an admin can update this project',
      });
    }

    // Validate fields if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Project name cannot be empty',
        });
      }
      if (name.trim().length > 150) {
        return res.status(400).json({
          success: false,
          message: 'Project name cannot exceed 150 characters',
        });
      }
      project.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Project description cannot be empty',
        });
      }
      if (description.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Project description cannot exceed 2000 characters',
        });
      }
      project.description = description.trim();
    }

    if (status !== undefined) {
      if (!PROJECT_STATUS_LIST.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project status',
        });
      }
      project.status = status;
    }

    // Date combination validation
    const effectiveStartDate = startDate !== undefined ? startDate : project.startDate;
    const effectiveDeadline = deadline !== undefined ? deadline : project.deadline;

    const dateCheck = validateDates(effectiveStartDate, effectiveDeadline);
    if (!dateCheck.valid) {
      return res.status(400).json({
        success: false,
        message: dateCheck.message,
      });
    }

    if (startDate !== undefined) {
      project.startDate = startDate || null;
    }
    if (deadline !== undefined) {
      project.deadline = deadline || null;
    }

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', USER_POPULATE_FIELDS)
      .populate('members', USER_POPULATE_FIELDS);

    emitToProject(project._id, 'project:updated', {
      project: updatedProject,
    });

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: updatedProject,
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
 * @desc    Delete project (Resource owner or Admin)
 * @route   DELETE /api/projects/:projectId
 * @access  Private (Project Owner & Admin)
 */
const deleteProject = async (req, res) => {
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

    // Resource ownership authorization
    if (!canManageProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or an admin can delete this project',
      });
    }

    // Cascade delete all tasks and their associated comments belonging to this project
    const taskIds = await Task.find({ project: projectId }).distinct('_id');
    if (taskIds.length > 0) {
      await Comment.deleteMany({ task: { $in: taskIds } });
    }
    await Task.deleteMany({ project: projectId });

    await Project.findByIdAndDelete(projectId);

    emitToProject(projectId, 'project:deleted', {
      projectId,
    });
    closeProjectRoom(projectId);

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Get all members of a project
 * @route   GET /api/projects/:projectId/members
 * @access  Private (Admin, Project Owner, Project Members)
 */
const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID',
      });
    }

    const project = await Project.findById(projectId).populate(
      'members',
      USER_POPULATE_FIELDS
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (!canViewProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    const members = (project.members || []).map(formatMember);

    return res.status(200).json({
      success: true,
      data: {
        members,
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
 * @desc    Add a member to a project
 * @route   POST /api/projects/:projectId/members
 * @access  Private (Admin & Project Owner only)
 */
const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body;

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

    if (!canManageProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or an admin can manage project members',
      });
    }

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
        message: 'Inactive users cannot be added to projects',
      });
    }

    if (isProjectMember(project, targetUser._id)) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    await Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { members: targetUser._id } },
      { new: true }
    );

    const updatedProject = await Project.findById(projectId).populate(
      'members',
      USER_POPULATE_FIELDS
    );

    // Notify the newly added member
    await createNotification({
      recipient: targetUser._id,
      sender: req.user._id,
      type: NOTIFICATION_TYPE.PROJECT_MEMBER_ADDED,
      message: `You were added to project: ${project.name}`,
      referenceId: project._id,
    });

    emitToProject(projectId, 'member:added', {
      projectId,
      user: formatMember(targetUser),
    });
    addUserToProjectRoom(targetUser._id, projectId);

    return res.status(200).json({
      success: true,
      message: 'Project member added successfully',
      data: {
        members: (updatedProject.members || []).map(formatMember),
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
 * @desc    Remove a member from a project
 * @route   DELETE /api/projects/:projectId/members/:userId
 * @access  Private (Admin & Project Owner only)
 */
const removeProjectMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (!canManageProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or an admin can manage project members',
      });
    }

    // Project owner cannot be removed from project members
    if (isProjectOwner(project, userId)) {
      return res.status(400).json({
        success: false,
        message: 'The project owner cannot be removed from the project',
      });
    }

    if (!isProjectMember(project, userId)) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this project',
      });
    }

    // Unassign all tasks in this project assigned to the removed member
    await Task.updateMany(
      {
        project: project._id,
        assignedTo: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: { assignedTo: null },
      }
    );

    await Project.findByIdAndUpdate(
      projectId,
      { $pull: { members: new mongoose.Types.ObjectId(userId) } },
      { new: true }
    );

    // Notify the removed member
    await createNotification({
      recipient: userId,
      sender: req.user._id,
      type: NOTIFICATION_TYPE.PROJECT_MEMBER_REMOVED,
      message: `You were removed from project: ${project.name}`,
      referenceId: project._id,
    });

    emitToProject(projectId, 'member:removed', {
      projectId,
      userId,
    });
    removeUserFromProjectRoom(userId, projectId);

    return res.status(200).json({
      success: true,
      message: 'Project member removed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Get eligible candidate users to add as project members
 * @route   GET /api/projects/:projectId/member-candidates
 * @access  Private (Admin & Project Owner only)
 */
const getMemberCandidates = async (req, res) => {
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

    if (!canManageProject(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or an admin can view member candidates',
      });
    }

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = {
      status: 'active',
      _id: { $nin: project.members },
    };

    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const escapedSearch = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const candidateUsers = await User.find(filter)
      .sort({ name: 1 })
      .limit(limit)
      .select('name email role status profileImage');

    return res.status(200).json({
      success: true,
      data: {
        users: candidateUsers.map(formatMember),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getMemberCandidates,
};

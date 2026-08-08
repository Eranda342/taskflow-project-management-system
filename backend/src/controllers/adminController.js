const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { ROLES } = require('../utils/roles');
const { NOTIFICATION_TYPE } = require('../utils/notificationConstants');
const { createNotification } = require('../services/notificationService');
const { emitToProject, addUserToProjectRoom } = require('../socket/socketManager');

const USER_POPULATE_FIELDS = 'name email role status profileImage';

/**
 * Format a User document for sanitized responses
 * @param {import('mongoose').Document} user
 * @returns {Object}
 */
const formatSanitizedUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  profileImage: user.profileImage,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * @desc    Get user operational summary before status or role changes
 * @route   GET /api/admin/users/:userId/summary
 * @access  Private (Admin only)
 */
const getUserOperationalSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const [
      ownedProjects,
      memberOfProjects,
      assignedTasks,
      createdTasks,
      authoredComments,
      unreadNotifications,
    ] = await Promise.all([
      Project.countDocuments({ owner: user._id }),
      Project.countDocuments({ members: user._id }),
      Task.countDocuments({ assignedTo: user._id }),
      Task.countDocuments({ createdBy: user._id }),
      Comment.countDocuments({ user: user._id }),
      Notification.countDocuments({ recipient: user._id, read: false }),
    ]);

    const canDeactivate = ownedProjects === 0;

    return res.status(200).json({
      success: true,
      data: {
        user: formatSanitizedUser(user),
        projects: {
          owned: ownedProjects,
          memberOf: memberOfProjects,
        },
        tasks: {
          assigned: assignedTasks,
          created: createdTasks,
        },
        comments: {
          authored: authoredComments,
        },
        notifications: {
          unread: unreadNotifications,
        },
        canDeactivate,
        ...(canDeactivate
          ? {}
          : {
              deactivationBlockReason:
                "Transfer ownership of the user's projects before deactivating this account",
            }),
      },
    });
  } catch (error) {
    console.error('getUserOperationalSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Transfer project ownership to another active project manager
 * @route   PATCH /api/admin/projects/:projectId/owner
 * @access  Private (Admin only)
 */
const transferProjectOwnership = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { newOwnerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID',
      });
    }

    if (!newOwnerId || typeof newOwnerId !== 'string' || !mongoose.Types.ObjectId.isValid(newOwnerId.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Valid new owner ID is required',
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const targetUser = await User.findById(newOwnerId.trim());

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found',
      });
    }

    if (targetUser.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Target user must be active',
      });
    }

    if (targetUser.role !== ROLES.PROJECT_MANAGER) {
      return res.status(400).json({
        success: false,
        message: 'Project ownership can only be transferred to a project manager',
      });
    }

    // Step 8: Same-owner transfer no-op handling
    if (project.owner.toString() === targetUser._id.toString()) {
      const populatedProject = await Project.findById(project._id)
        .populate('owner', USER_POPULATE_FIELDS)
        .populate('members', USER_POPULATE_FIELDS);

      return res.status(200).json({
        success: true,
        message: 'User is already the project owner',
        data: {
          project: populatedProject,
        },
      });
    }

    // Step 7: Ownership transfer and membership preservation
    project.owner = targetUser._id;

    // Ensure new owner is in project members array
    const targetUserIdStr = targetUser._id.toString();
    const isMember = project.members.some(
      (m) => (m._id ? m._id.toString() : m.toString()) === targetUserIdStr
    );
    if (!isMember) {
      project.members.push(targetUser._id);
    }

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', USER_POPULATE_FIELDS)
      .populate('members', USER_POPULATE_FIELDS);

    // Step 10: Persistent notification for new owner
    await createNotification({
      recipient: targetUser._id,
      sender: req.user._id,
      type: NOTIFICATION_TYPE.PROJECT_OWNERSHIP_TRANSFERRED,
      message: `You are now the owner of project: ${project.name}`,
      referenceId: project._id,
    });

    // Step 9: Realtime event to project room
    emitToProject(project._id, 'project:updated', {
      project: updatedProject,
      changeType: 'ownership',
    });
    addUserToProjectRoom(targetUser._id, project._id);

    return res.status(200).json({
      success: true,
      message: 'Project ownership transferred successfully',
      data: {
        project: updatedProject,
      },
    });
  } catch (error) {
    console.error('transferProjectOwnership error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getUserOperationalSummary,
  transferProjectOwnership,
};

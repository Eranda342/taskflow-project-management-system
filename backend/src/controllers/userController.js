const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { ROLES, ROLE_LIST } = require('../utils/roles');
const { isValidObjectId, parsePagination } = require('../utils/validation');

/**
 * Format a User document for public API responses without sensitive fields
 * @param {import('mongoose').Document} user
 * @returns {Object}
 */
const formatUser = (user) => ({
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
 * @desc    Get all users with filtering, search, and pagination
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
const getUsers = async (req, res) => {
  try {
    const pagination = parsePagination(req.query, 10, 100);
    if (!pagination.valid) {
      return res.status(400).json({
        success: false,
        message: pagination.message,
      });
    }
    const { page, limit, skip } = pagination;

    const filter = {};

    // Search by name or email case-insensitively
    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const escapedSearch = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    // Filter by valid role
    if (req.query.role !== undefined) {
      if (!ROLE_LIST.includes(req.query.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role filter',
        });
      }
      filter.role = req.query.role;
    }

    // Filter by valid status
    if (req.query.status !== undefined) {
      if (!['active', 'inactive'].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status filter',
        });
      }
      filter.status = req.query.status;
    }

    const [users, totalUsers] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      data: {
        users: users.map(formatUser),
        pagination: {
          page,
          limit,
          totalUsers,
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
 * @desc    Get single user by ID
 * @route   GET /api/users/:userId
 * @access  Private (Admin only)
 */
const getUserById = async (req, res) => {
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

    return res.status(200).json({
      success: true,
      data: {
        user: formatUser(user),
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
 * @desc    Update a user's role
 * @route   PATCH /api/users/:userId/role
 * @access  Private (Admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    if (!role || !ROLE_LIST.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    // Admin self-demotion protection
    if (req.user._id.toString() === userId.toString() && role !== ROLES.ADMIN) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot remove their own admin role',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Protect against downgrading a project manager who owns projects
    if (user.role === ROLES.PROJECT_MANAGER && role === ROLES.TEAM_MEMBER) {
      const ownedProjectsCount = await Project.countDocuments({ owner: user._id });
      if (ownedProjectsCount > 0) {
        return res.status(409).json({
          success: false,
          message: "Transfer ownership of this user's projects before changing their role",
        });
      }
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: formatUser(user),
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
 * @desc    Update a user's status
 * @route   PATCH /api/users/:userId/status
 * @access  Private (Admin only)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    // Admin self-deactivation protection
    if (req.user._id.toString() === userId.toString() && status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot deactivate their own account',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Deactivation safety checks and operational cleanup
    if (status === 'inactive') {
      const ownedProjectsCount = await Project.countDocuments({ owner: user._id });
      if (ownedProjectsCount > 0) {
        return res.status(409).json({
          success: false,
          message: "Transfer ownership of this user's projects before deactivating the account",
        });
      }

      // Safe deactivation
      user.status = 'inactive';
      await user.save();

      // Operational cleanup: remove from all project memberships
      await Project.updateMany(
        { members: user._id },
        { $pull: { members: user._id } }
      );

      // Operational cleanup: unassign all tasks assigned to user
      await Task.updateMany(
        { assignedTo: user._id },
        { $set: { assignedTo: null } }
      );
    } else {
      // Reactivation (active): does not restore old memberships/assignments
      user.status = 'active';
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: {
        user: formatUser(user),
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
 * @desc    Update authenticated user's own profile (name, profileImage)
 * @route   PATCH /api/users/me/profile
 * @access  Private (Authenticated user)
 */
const updateOwnProfile = async (req, res) => {
  try {
    const { name, profileImage } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name is required',
        });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot exceed 100 characters',
        });
      }
      updates.name = name.trim();
    }

    if (profileImage !== undefined) {
      if (profileImage !== null && typeof profileImage !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid profile image format',
        });
      }
      updates.profileImage = profileImage;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid profile fields provided for update',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: formatUser(user),
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
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  updateOwnProfile,
};

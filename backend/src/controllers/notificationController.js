const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { isValidObjectId, parsePagination, parseBooleanQuery } = require('../utils/validation');

// Fields to populate for sender (omitting sensitive fields like password)
const SENDER_POPULATE_FIELDS = 'name email role profileImage';

/**
 * @desc    Get current user's notifications (newest first with pagination & optional read filter)
 * @route   GET /api/notifications
 * @access  Private (Recipient only)
 */
const getNotifications = async (req, res) => {
  try {
    const pagination = parsePagination(req.query, 20, 100);
    if (!pagination.valid) {
      return res.status(400).json({
        success: false,
        message: pagination.message,
      });
    }
    const { page, limit, skip } = pagination;

    const filter = { recipient: req.user._id };

    const readCheck = parseBooleanQuery(req.query.read, 'read');
    if (!readCheck.valid) {
      return res.status(400).json({
        success: false,
        message: readCheck.message,
      });
    }
    if (readCheck.value !== undefined) {
      filter.read = readCheck.value;
    }

    const [notifications, totalNotifications] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', SENDER_POPULATE_FIELDS),
      Notification.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalNotifications / limit) || 0;

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalNotifications,
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
 * @desc    Get count of unread notifications for authenticated user
 * @route   GET /api/notifications/unread-count
 * @access  Private (Recipient only)
 */
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      data: {
        unreadCount,
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
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:notificationId/read
 * @access  Private (Recipient only)
 */
const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.read = true;
    await notification.save();

    const populatedNotification = await Notification.findById(notification._id).populate(
      'sender',
      SENDER_POPULATE_FIELDS
    );

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification: populatedNotification,
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
 * @desc    Mark all unread notifications for the authenticated user as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private (Recipient only)
 */
const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        updatedCount: result.modifiedCount,
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
 * @desc    Delete a single notification belonging to the authenticated user
 * @route   DELETE /api/notifications/:notificationId
 * @access  Private (Recipient only)
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};

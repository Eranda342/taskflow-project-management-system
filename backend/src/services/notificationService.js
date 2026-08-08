const mongoose = require('mongoose');
const Notification = require('../models/Notification');

/**
 * Create a single notification for a recipient
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.recipient
 * @param {string|mongoose.Types.ObjectId|null} [params.sender]
 * @param {string} params.type
 * @param {string} params.message
 * @param {string|mongoose.Types.ObjectId|null} [params.referenceId]
 * @returns {Promise<Object|null>}
 */
const createNotification = async ({ recipient, sender = null, type, message, referenceId = null }) => {
  if (!recipient) return null;

  const recipientId = recipient._id ? recipient._id.toString() : recipient.toString();
  const senderId = sender ? (sender._id ? sender._id.toString() : sender.toString()) : null;

  // Do not self-notify
  if (senderId && recipientId === senderId) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    return null;
  }

  return await Notification.create({
    recipient: new mongoose.Types.ObjectId(recipientId),
    sender:
      senderId && mongoose.Types.ObjectId.isValid(senderId) ? new mongoose.Types.ObjectId(senderId) : null,
    type,
    message,
    referenceId:
      referenceId && mongoose.Types.ObjectId.isValid(referenceId.toString())
        ? new mongoose.Types.ObjectId(referenceId)
        : null,
  });
};

/**
 * Create notifications for multiple recipients (deduplicated, excluding sender)
 * @param {Object} params
 * @param {Array<string|mongoose.Types.ObjectId>} params.recipients
 * @param {string|mongoose.Types.ObjectId|null} [params.sender]
 * @param {string} params.type
 * @param {string} params.message
 * @param {string|mongoose.Types.ObjectId|null} [params.referenceId]
 * @returns {Promise<Array<Object>>}
 */
const createNotifications = async ({ recipients, sender = null, type, message, referenceId = null }) => {
  if (!Array.isArray(recipients) || recipients.length === 0) return [];

  const senderId = sender ? (sender._id ? sender._id.toString() : sender.toString()) : null;

  // Deduplicate and filter out sender, nulls, and invalids
  const uniqueRecipientIds = Array.from(
    new Set(
      recipients
        .filter(Boolean)
        .map((r) => (r._id ? r._id.toString() : r.toString()))
        .filter((id) => mongoose.Types.ObjectId.isValid(id) && (!senderId || id !== senderId))
    )
  );

  if (uniqueRecipientIds.length === 0) return [];

  const validReferenceId =
    referenceId && mongoose.Types.ObjectId.isValid(referenceId.toString())
      ? new mongoose.Types.ObjectId(referenceId)
      : null;
  const validSenderId =
    senderId && mongoose.Types.ObjectId.isValid(senderId) ? new mongoose.Types.ObjectId(senderId) : null;

  const docs = uniqueRecipientIds.map((recipientId) => ({
    recipient: new mongoose.Types.ObjectId(recipientId),
    sender: validSenderId,
    type,
    message,
    referenceId: validReferenceId,
    read: false,
  }));

  return await Notification.insertMany(docs);
};

module.exports = {
  createNotification,
  createNotifications,
};

const mongoose = require('mongoose');

// Mock dependencies before importing notificationService
jest.mock('../../src/models/Notification');
jest.mock('../../src/socket/socketManager');

const Notification = require('../../src/models/Notification');
const { emitToUser } = require('../../src/socket/socketManager');
const {
  createNotification,
  createNotifications,
} = require('../../src/services/notificationService');

describe('Notification Service (src/services/notificationService.js)', () => {
  const recipientId = new mongoose.Types.ObjectId().toString();
  const senderId = new mongoose.Types.ObjectId().toString();
  const referenceId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('persists a single notification to MongoDB and emits a socket event to the recipient', async () => {
      const mockCreatedDoc = {
        _id: new mongoose.Types.ObjectId(),
        recipient: new mongoose.Types.ObjectId(recipientId),
        sender: new mongoose.Types.ObjectId(senderId),
        type: 'task_assigned',
        message: 'You were assigned to a new task',
        referenceId: new mongoose.Types.ObjectId(referenceId),
        read: false,
      };

      const mockPopulatedDoc = {
        ...mockCreatedDoc,
        sender: {
          _id: new mongoose.Types.ObjectId(senderId),
          name: 'Project Manager',
          email: 'pm@example.com',
          role: 'project_manager',
        },
      };

      Notification.create.mockResolvedValue(mockCreatedDoc);
      Notification.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPopulatedDoc),
      });

      const result = await createNotification({
        recipient: { _id: recipientId },
        sender: { _id: senderId },
        type: 'task_assigned',
        message: 'You were assigned to a new task',
        referenceId: new mongoose.Types.ObjectId(referenceId),
      });

      expect(Notification.create).toHaveBeenCalledTimes(1);
      expect(emitToUser).toHaveBeenCalledTimes(1);
      expect(emitToUser).toHaveBeenCalledWith(recipientId, 'notification:new', {
        notification: mockPopulatedDoc,
      });
      expect(result).toEqual(mockCreatedDoc);
    });

    it('creates system notification when sender and referenceId are omitted', async () => {
      const mockCreatedDoc = {
        _id: new mongoose.Types.ObjectId(),
        recipient: new mongoose.Types.ObjectId(recipientId),
        sender: null,
        type: 'account_deactivated',
        message: 'Your account was deactivated',
        referenceId: null,
        read: false,
      };

      Notification.create.mockResolvedValue(mockCreatedDoc);
      Notification.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const result = await createNotification({
        recipient: recipientId,
        type: 'account_deactivated',
        message: 'Your account was deactivated',
      });

      expect(Notification.create).toHaveBeenCalledTimes(1);
      expect(emitToUser).toHaveBeenCalledWith(recipientId, 'notification:new', {
        notification: mockCreatedDoc,
      });
      expect(result).toEqual(mockCreatedDoc);
    });

    it('suppresses self-notification when sender and recipient are the same user', async () => {
      const sameUserId = new mongoose.Types.ObjectId().toString();

      const result = await createNotification({
        recipient: sameUserId,
        sender: sameUserId,
        type: 'task_status_updated',
        message: 'You updated the status',
      });

      expect(result).toBeNull();
      expect(Notification.create).not.toHaveBeenCalled();
      expect(emitToUser).not.toHaveBeenCalled();
    });

    it('returns null and does not persist when recipient is missing or invalid ObjectId', async () => {
      const missingResult = await createNotification({
        recipient: null,
        sender: senderId,
        type: 'task_assigned',
        message: 'Missing recipient',
      });
      expect(missingResult).toBeNull();

      const invalidResult = await createNotification({
        recipient: 'invalid-id-xyz',
        sender: senderId,
        type: 'task_assigned',
        message: 'Invalid recipient ID',
      });
      expect(invalidResult).toBeNull();

      expect(Notification.create).not.toHaveBeenCalled();
      expect(emitToUser).not.toHaveBeenCalled();
    });

    it('does not emit a socket event if database persistence fails', async () => {
      Notification.create.mockRejectedValue(new Error('Mongo connection error'));

      await expect(
        createNotification({
          recipient: recipientId,
          sender: senderId,
          type: 'task_assigned',
          message: 'Failing notification',
        })
      ).rejects.toThrow('Mongo connection error');

      expect(emitToUser).not.toHaveBeenCalled();
    });
  });

  describe('createNotifications (bulk / multi-recipient)', () => {
    it('deduplicates duplicate recipient IDs and excludes sender from recipient list', async () => {
      const user1 = new mongoose.Types.ObjectId().toString();
      const user2 = new mongoose.Types.ObjectId().toString();

      const mockInsertedDocs = [
        {
          _id: new mongoose.Types.ObjectId(),
          recipient: new mongoose.Types.ObjectId(user1),
          sender: new mongoose.Types.ObjectId(senderId),
          type: 'comment_added',
          message: 'A new comment was posted',
          read: false,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          recipient: new mongoose.Types.ObjectId(user2),
          sender: new mongoose.Types.ObjectId(senderId),
          type: 'comment_added',
          message: 'A new comment was posted',
          read: false,
        },
      ];

      Notification.insertMany.mockResolvedValue(mockInsertedDocs);
      Notification.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInsertedDocs),
      });

      // Pass user1 as object and string, user2, senderId as object, null once, and invalid id once
      const recipients = [
        { _id: user1 },
        user1,
        user2,
        { _id: senderId },
        null,
        'invalid-id',
      ];

      const result = await createNotifications({
        recipients,
        sender: { _id: senderId },
        type: 'comment_added',
        message: 'A new comment was posted',
        referenceId,
      });

      expect(Notification.insertMany).toHaveBeenCalledTimes(1);
      const insertedPayload = Notification.insertMany.mock.calls[0][0];

      // Must only contain user1 and user2 (exactly 2 docs)
      expect(insertedPayload).toHaveLength(2);
      expect(insertedPayload[0].recipient.toString()).toBe(user1);
      expect(insertedPayload[1].recipient.toString()).toBe(user2);

      // Emitted socket event to both unique recipients
      expect(emitToUser).toHaveBeenCalledTimes(2);
      expect(emitToUser).toHaveBeenCalledWith(user1, 'notification:new', expect.any(Object));
      expect(emitToUser).toHaveBeenCalledWith(user2, 'notification:new', expect.any(Object));
      expect(result).toEqual(mockInsertedDocs);
    });

    it('creates bulk notifications without sender or referenceId', async () => {
      const user1 = new mongoose.Types.ObjectId().toString();
      const mockInsertedDocs = [
        {
          _id: new mongoose.Types.ObjectId(),
          recipient: new mongoose.Types.ObjectId(user1),
          sender: null,
          type: 'project_broadcast',
          message: 'Broadcast message',
          read: false,
        },
      ];

      Notification.insertMany.mockResolvedValue(mockInsertedDocs);
      Notification.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInsertedDocs),
      });

      const result = await createNotifications({
        recipients: [user1],
        type: 'project_broadcast',
        message: 'Broadcast message',
      });

      expect(Notification.insertMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockInsertedDocs);
    });

    it('returns empty array when recipients array is empty, not an array, or contains only sender/invalid IDs', async () => {
      const resultNotArray = await createNotifications({
        recipients: null,
        sender: senderId,
        type: 'comment_added',
        message: 'Not array test',
      });
      expect(resultNotArray).toEqual([]);

      const resultEmpty = await createNotifications({
        recipients: [],
        sender: senderId,
        type: 'comment_added',
        message: 'Empty test',
      });
      expect(resultEmpty).toEqual([]);

      const resultFiltered = await createNotifications({
        recipients: [senderId, null, 'invalid-id'],
        sender: senderId,
        type: 'comment_added',
        message: 'Filtered test',
      });
      expect(resultFiltered).toEqual([]);

      expect(Notification.insertMany).not.toHaveBeenCalled();
      expect(emitToUser).not.toHaveBeenCalled();
    });

    it('does not emit socket events if bulk persistence fails', async () => {
      const user1 = new mongoose.Types.ObjectId().toString();
      Notification.insertMany.mockRejectedValue(new Error('Mongo bulk write error'));

      await expect(
        createNotifications({
          recipients: [user1],
          sender: senderId,
          type: 'comment_added',
          message: 'Failing bulk notification',
        })
      ).rejects.toThrow('Mongo bulk write error');

      expect(emitToUser).not.toHaveBeenCalled();
    });
  });
});

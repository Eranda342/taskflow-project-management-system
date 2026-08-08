const request = require('supertest');
const app = require('../../src/app');
const Notification = require('../../src/models/Notification');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const {
  createTestUser,
  createTestProject,
  createTestTask,
  getAuthToken,
} = require('../helpers/factories');

describe('Notifications Integration Tests (/api/notifications/*)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('Notification Creation Triggers', () => {
    it('creates persistent notification when task is assigned to a member', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
      const task = await createTestTask({ project: project._id, createdBy: pm._id });

      const res = await request(app)
        .patch(`/api/tasks/${task._id}/assign`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({ userId: tm._id.toString() });

      expect(res.status).toBe(200);

      const notif = await Notification.findOne({ recipient: tm._id, type: 'task_assigned' });
      expect(notif).not.toBeNull();
      expect(notif.sender.toString()).toBe(pm._id.toString());
      expect(notif.read).toBe(false);
    });

    it('creates persistent notification when user is added to a project', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id] });

      const res = await request(app)
        .post(`/api/projects/${project._id}/members`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({ userId: tm._id.toString() });

      expect(res.status).toBe(200);

      const notif = await Notification.findOne({ recipient: tm._id, type: 'project_member_added' });
      expect(notif).not.toBeNull();
    });
  });

  describe('GET /api/notifications and GET /api/notifications/unread-count', () => {
    it('returns only notifications belonging to authenticated user and accurate unread count', async () => {
      const userA = await createTestUser({ name: 'User A' });
      const userB = await createTestUser({ name: 'User B' });

      await Notification.create([
        { recipient: userA._id, type: 'task_assigned', message: 'Task 1', read: false },
        { recipient: userA._id, type: 'comment_added', message: 'Comment 1', read: true },
        { recipient: userB._id, type: 'task_assigned', message: 'User B Task', read: false },
      ]);

      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${getAuthToken(userA._id)}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.notifications.length).toBe(2);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${getAuthToken(userA._id)}`);

      expect(countRes.status).toBe(200);
      expect(countRes.body.data.unreadCount).toBe(1);
    });
  });

  describe('PATCH /api/notifications/:id/read and PATCH /api/notifications/read-all', () => {
    it('allows recipient to mark single notification and all notifications as read', async () => {
      const user = await createTestUser();
      const otherUser = await createTestUser();

      const notif1 = await Notification.create({ recipient: user._id, type: 'task_assigned', message: 'T1', read: false });
      const notif2 = await Notification.create({ recipient: user._id, type: 'task_assigned', message: 'T2', read: false });

      // Mark single read
      const singleRes = await request(app)
        .patch(`/api/notifications/${notif1._id}/read`)
        .set('Authorization', `Bearer ${getAuthToken(user._id)}`);
      expect(singleRes.status).toBe(200);
      expect(singleRes.body.data.notification.read).toBe(true);

      // Other user cannot mark user's notification
      const unauthorizedRes = await request(app)
        .patch(`/api/notifications/${notif2._id}/read`)
        .set('Authorization', `Bearer ${getAuthToken(otherUser._id)}`);
      expect(unauthorizedRes.status).toBe(404);

      // Mark all read
      const allRes = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${getAuthToken(user._id)}`);
      expect(allRes.status).toBe(200);

      const count = await Notification.countDocuments({ recipient: user._id, read: false });
      expect(count).toBe(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('allows recipient to delete own notification, denies other user with 404', async () => {
      const user = await createTestUser();
      const otherUser = await createTestUser();
      const notif = await Notification.create({ recipient: user._id, type: 'task_assigned', message: 'T1' });

      const failRes = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set('Authorization', `Bearer ${getAuthToken(otherUser._id)}`);
      expect(failRes.status).toBe(404);

      const successRes = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set('Authorization', `Bearer ${getAuthToken(user._id)}`);
      expect(successRes.status).toBe(200);
    });
  });
});

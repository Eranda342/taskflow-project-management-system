const request = require('supertest');
const app = require('../../src/app');
const Comment = require('../../src/models/Comment');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const {
  createTestUser,
  createTestProject,
  createTestTask,
  getAuthToken,
} = require('../helpers/factories');

describe('Comments Integration Tests (/api/comments/*, /api/tasks/:taskId/comments)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/tasks/:taskId/comments', () => {
    it('allows a project member to add a comment with server-controlled author', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
      const task = await createTestTask({ project: project._id, createdBy: pm._id });

      const res = await request(app)
        .post(`/api/tasks/${task._id}/comments`)
        .set('Authorization', `Bearer ${getAuthToken(tm._id)}`)
        .send({ message: 'Starting work on this task today.' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.message).toBe('Starting work on this task today.');
      expect(res.body.data.comment.user._id.toString()).toBe(tm._id.toString());
      expect(res.body.data.comment.user.password).toBeUndefined();
    });

    it('denies outsider non-member with 403 Forbidden', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const outsider = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id] });
      const task = await createTestTask({ project: project._id, createdBy: pm._id });

      const res = await request(app)
        .post(`/api/tasks/${task._id}/comments`)
        .set('Authorization', `Bearer ${getAuthToken(outsider._id)}`)
        .send({ message: 'Injected comment' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/tasks/:taskId/comments', () => {
    it('returns task comments without exposing sensitive user passwords', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
      const task = await createTestTask({ project: project._id, createdBy: pm._id });

      await Comment.create({ task: task._id, user: tm._id, message: 'First comment' });

      const res = await request(app)
        .get(`/api/tasks/${task._id}/comments`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);

      expect(res.status).toBe(200);
      expect(res.body.data.comments.length).toBe(1);
      expect(res.body.data.comments[0].user.password).toBeUndefined();
    });
  });

  describe('PATCH /api/comments/:commentId', () => {
    it('allows author to update comment message', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
      const task = await createTestTask({ project: project._id, createdBy: pm._id });
      const comment = await Comment.create({ task: task._id, user: tm._id, message: 'Original comment' });

      const res = await request(app)
        .patch(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${getAuthToken(tm._id)}`)
        .send({ message: 'Updated comment text' });

      expect(res.status).toBe(200);
      expect(res.body.data.comment.message).toBe('Updated comment text');
    });

    it('denies project owner or admin from modifying someone else comment message', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
      const task = await createTestTask({ project: project._id, createdBy: pm._id });
      const comment = await Comment.create({ task: task._id, user: tm._id, message: 'Member comment' });

      const res = await request(app)
        .patch(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({ message: 'Owner attempting edit' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/comments/:commentId', () => {
    it('allows author, project owner, and admin to delete comment', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const admin = await createTestUser({ role: 'admin' });

      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
      const task = await createTestTask({ project: project._id, createdBy: pm._id });

      // Author deletes
      const c1 = await Comment.create({ task: task._id, user: tm._id, message: 'C1' });
      const del1 = await request(app)
        .delete(`/api/comments/${c1._id}`)
        .set('Authorization', `Bearer ${getAuthToken(tm._id)}`);
      expect(del1.status).toBe(200);

      // Owner moderation delete
      const c2 = await Comment.create({ task: task._id, user: tm._id, message: 'C2' });
      const del2 = await request(app)
        .delete(`/api/comments/${c2._id}`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);
      expect(del2.status).toBe(200);

      // Admin moderation delete
      const c3 = await Comment.create({ task: task._id, user: tm._id, message: 'C3' });
      const del3 = await request(app)
        .delete(`/api/comments/${c3._id}`)
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`);
      expect(del3.status).toBe(200);
    });
  });
});

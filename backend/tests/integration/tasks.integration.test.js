const request = require('supertest');
const app = require('../../src/app');
const Task = require('../../src/models/Task');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const { createTestUser, createTestProject, createTestTask, getAuthToken } = require('../helpers/factories');

describe('Task Integration Tests (/api/tasks/*, /api/projects/:projectId/tasks)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/projects/:projectId/tasks', () => {
    it('allows project owner to create a task with default status "todo" and unassigned', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id] });

      const res = await request(app)
        .post(`/api/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({
          title: 'Implement Database Schema',
          description: 'Define Mongoose schemas for projects and tasks',
          priority: 'high',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Implement Database Schema');
      expect(res.body.data.task.status).toBe('todo');
      expect(res.body.data.task.assignedTo).toBeNull();
      expect(res.body.data.task.createdBy._id.toString()).toBe(pm._id.toString());
      expect((res.body.data.task.project._id || res.body.data.task.project).toString()).toBe(project._id.toString());
    });

    it('denies Team Member from creating task with 403 Forbidden', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });

      const res = await request(app)
        .post(`/api/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${getAuthToken(tm._id)}`)
        .send({ title: 'Unauthorized Task' });

      expect(res.status).toBe(403);
    });

    it('ignores client attempts to inject status or assignedTo during creation', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });

      const res = await request(app)
        .post(`/api/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({
          title: 'Injected Task',
          status: 'completed',
          assignedTo: tm._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.task.status).toBe('todo');
      expect(res.body.data.task.assignedTo).toBeNull();
    });
  });

  describe('GET /api/projects/:projectId/tasks and GET /api/tasks/:taskId', () => {
    it('allows project member to view project tasks and task details', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
      const task = await createTestTask({ project: project._id, createdBy: pm._id });

      const listRes = await request(app)
        .get(`/api/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${getAuthToken(tm._id)}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.tasks.length).toBe(1);

      const detailRes = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${getAuthToken(tm._id)}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.task.title).toBe(task.title);
    });

    it('denies outsider non-member with 403 Forbidden', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const outsider = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id] });
      const task = await createTestTask({ project: project._id, createdBy: pm._id });

      const res = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${getAuthToken(outsider._id)}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/tasks/:taskId/assign', () => {
    it('allows project owner to assign task to a project member', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
      const task = await createTestTask({ project: project._id, createdBy: pm._id });

      const res = await request(app)
        .patch(`/api/tasks/${task._id}/assign`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({ userId: tm._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.task.assignedTo._id.toString()).toBe(tm._id.toString());
    });

    it('rejects assigning task to non-member or inactive user with 400 Bad Request', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const outsider = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id] });
      const task = await createTestTask({ project: project._id, createdBy: pm._id });

      const res = await request(app)
        .patch(`/api/tasks/${task._id}/assign`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({ userId: outsider._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/must be a member/i);
    });
  });

  describe('PATCH /api/tasks/:taskId/status', () => {
    it('allows assigned team member to update status through valid workflow', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
      const task = await createTestTask({
        project: project._id,
        createdBy: pm._id,
        assignedTo: tm._id,
        status: 'todo',
      });

      const res = await request(app)
        .patch(`/api/tasks/${task._id}/status`)
        .set('Authorization', `Bearer ${getAuthToken(tm._id)}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('in_progress');
    });

    it('denies unassigned team member from updating task status with 403 Forbidden', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tmAssigned = await createTestUser({ role: 'team_member' });
      const tmOther = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tmAssigned._id, tmOther._id] });
      const task = await createTestTask({
        project: project._id,
        createdBy: pm._id,
        assignedTo: tmAssigned._id,
        status: 'todo',
      });

      const res = await request(app)
        .patch(`/api/tasks/${task._id}/status`)
        .set('Authorization', `Bearer ${getAuthToken(tmOther._id)}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/tasks/my', () => {
    it('returns only tasks assigned to the authenticated user', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm1 = await createTestUser({ role: 'team_member' });
      const tm2 = await createTestUser({ role: 'team_member' });

      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm1._id, tm2._id] });
      const task1 = await createTestTask({ project: project._id, createdBy: pm._id, assignedTo: tm1._id });
      await createTestTask({ project: project._id, createdBy: pm._id, assignedTo: tm2._id });

      const res = await request(app)
        .get('/api/tasks/my')
        .set('Authorization', `Bearer ${getAuthToken(tm1._id)}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0]._id.toString()).toBe(task1._id.toString());
    });
  });
});

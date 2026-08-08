const request = require('supertest');
const app = require('../../src/app');
const Project = require('../../src/models/Project');
const Task = require('../../src/models/Task');
const Comment = require('../../src/models/Comment');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const {
  createTestUser,
  createTestProject,
  createTestTask,
  getAuthToken,
} = require('../helpers/factories');

describe('Cascade & Lifecycle Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('deleting a task deletes all associated comments', async () => {
    const pm = await createTestUser({ role: 'project_manager' });
    const tm = await createTestUser({ role: 'team_member' });
    const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
    const task = await createTestTask({ project: project._id, createdBy: pm._id });

    await Comment.create([
      { task: task._id, user: tm._id, message: 'Comment 1' },
      { task: task._id, user: pm._id, message: 'Comment 2' },
    ]);

    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);

    expect(res.status).toBe(200);

    const remainingComments = await Comment.find({ task: task._id });
    expect(remainingComments.length).toBe(0);
  });

  it('deleting a project deletes all its tasks and their associated comments', async () => {
    const pm = await createTestUser({ role: 'project_manager' });
    const tm = await createTestUser({ role: 'team_member' });
    const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
    const task1 = await createTestTask({ project: project._id, createdBy: pm._id });
    const task2 = await createTestTask({ project: project._id, createdBy: pm._id });

    await Comment.create([
      { task: task1._id, user: tm._id, message: 'Comment on Task 1' },
      { task: task2._id, user: tm._id, message: 'Comment on Task 2' },
    ]);

    const res = await request(app)
      .delete(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);

    expect(res.status).toBe(200);

    const remainingTasks = await Task.find({ project: project._id });
    expect(remainingTasks.length).toBe(0);

    const remainingComments = await Comment.find({
      task: { $in: [task1._id, task2._id] },
    });
    expect(remainingComments.length).toBe(0);
  });

  it('removing a project member unassigns all tasks assigned to that member in the project', async () => {
    const pm = await createTestUser({ role: 'project_manager' });
    const tm = await createTestUser({ role: 'team_member' });
    const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });

    const task = await createTestTask({
      project: project._id,
      createdBy: pm._id,
      assignedTo: tm._id,
    });

    const res = await request(app)
      .delete(`/api/projects/${project._id}/members/${tm._id}`)
      .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);

    expect(res.status).toBe(200);

    const updatedTask = await Task.findById(task._id);
    expect(updatedTask.assignedTo).toBeNull();
  });

  it('deactivating a non-owner user cleans up project memberships and unassigns tasks while preserving comments', async () => {
    const admin = await createTestUser({ role: 'admin' });
    const pm = await createTestUser({ role: 'project_manager' });
    const tm = await createTestUser({ role: 'team_member' });

    const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
    const task = await createTestTask({
      project: project._id,
      createdBy: pm._id,
      assignedTo: tm._id,
    });
    const comment = await Comment.create({
      task: task._id,
      user: tm._id,
      message: 'Historical contribution',
    });

    const res = await request(app)
      .patch(`/api/users/${tm._id}/status`)
      .set('Authorization', `Bearer ${getAuthToken(admin._id)}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);

    // Project membership removed
    const updatedProject = await Project.findById(project._id);
    expect(updatedProject.members.map((m) => m.toString())).not.toContain(tm._id.toString());

    // Task unassigned
    const updatedTask = await Task.findById(task._id);
    expect(updatedTask.assignedTo).toBeNull();

    // Historical comment remains intact
    const preservedComment = await Comment.findById(comment._id);
    expect(preservedComment).not.toBeNull();
    expect(preservedComment.message).toBe('Historical contribution');
  });
});

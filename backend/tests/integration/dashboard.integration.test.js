const request = require('supertest');
const app = require('../../src/app');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const {
  createTestUser,
  createTestProject,
  createTestTask,
  getAuthToken,
} = require('../helpers/factories');

describe('Dashboard Integration Tests (/api/dashboard)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('returns role-specific dashboard metrics for Admin', async () => {
    const admin = await createTestUser({ role: 'admin' });
    const pm = await createTestUser({ role: 'project_manager' });
    const tm = await createTestUser({ role: 'team_member' });

    const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });
    await createTestTask({ project: project._id, createdBy: pm._id, assignedTo: tm._id });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${getAuthToken(admin._id)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('admin');
    expect(res.body.data.users.total).toBeGreaterThanOrEqual(3);
    expect(res.body.data.projects.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.tasks.total).toBeGreaterThanOrEqual(1);
  });

  it('returns owned vs accessible project counts for Project Manager', async () => {
    const pm1 = await createTestUser({ role: 'project_manager' });
    const pm2 = await createTestUser({ role: 'project_manager' });

    await createTestProject({ owner: pm1._id, members: [pm1._id] });
    await createTestProject({ owner: pm2._id, members: [pm2._id, pm1._id] });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${getAuthToken(pm1._id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('project_manager');
    expect(res.body.data.projects.owned).toBe(1);
    expect(res.body.data.projects.totalAccessible).toBe(2);
  });

  it('restricts Team Member dashboard strictly to assigned tasks and accessible projects', async () => {
    const pm = await createTestUser({ role: 'project_manager' });
    const tm1 = await createTestUser({ role: 'team_member' });
    const tm2 = await createTestUser({ role: 'team_member' });

    const project = await createTestProject({ owner: pm._id, members: [pm._id, tm1._id] });
    await createTestTask({
      project: project._id,
      createdBy: pm._id,
      assignedTo: tm1._id,
      status: 'in_progress',
    });
    // Task assigned to tm2 in a separate project
    const otherProject = await createTestProject({ owner: pm._id, members: [pm._id, tm2._id] });
    await createTestTask({
      project: otherProject._id,
      createdBy: pm._id,
      assignedTo: tm2._id,
      status: 'in_progress',
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${getAuthToken(tm1._id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('team_member');
    expect(res.body.data.myTasks.total).toBe(1);
    expect(res.body.data.projects.total).toBe(1);
  });

  it('correctly calculates overdue tasks strictly for non-completed past due tasks', async () => {
    const pm = await createTestUser({ role: 'project_manager' });
    const tm = await createTestUser({ role: 'team_member' });
    const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday

    // Overdue task (past due date and in_progress)
    await createTestTask({
      project: project._id,
      createdBy: pm._id,
      assignedTo: tm._id,
      status: 'in_progress',
      dueDate: pastDate,
    });

    // Completed past due task (should NOT be counted as overdue)
    await createTestTask({
      project: project._id,
      createdBy: pm._id,
      assignedTo: tm._id,
      status: 'completed',
      dueDate: pastDate,
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${getAuthToken(tm._id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.myTasks.overdue).toBe(1);
  });
});

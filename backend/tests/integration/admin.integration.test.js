const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Project = require('../../src/models/Project');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const {
  createTestUser,
  createTestProject,
  getAuthToken,
} = require('../helpers/factories');

describe('Admin Integration Tests (/api/admin/*)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('GET /api/admin/stats and GET /api/admin/users/:userId/summary', () => {
    it('allows Admin to view platform stats and user operational summary', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const tm = await createTestUser({ role: 'team_member' });

      const statsRes = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.data.totals.users).toBeGreaterThanOrEqual(2);

      const summaryRes = await request(app)
        .get(`/api/admin/users/${tm._id}/summary`)
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.data.user.id.toString()).toBe(tm._id.toString());
      expect(summaryRes.body.data.projects).toBeDefined();
    });

    it('denies Project Manager and Team Member from accessing admin endpoints with 403 Forbidden', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });

      const pmRes = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);
      expect(pmRes.status).toBe(403);

      const tmRes = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${getAuthToken(tm._id)}`);
      expect(tmRes.status).toBe(403);
    });
  });

  describe('Ownership Transfer & Project Owner Lifecycle Protection', () => {
    it('protects project owners from deactivation and role downgrade while owning projects', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const pm = await createTestUser({ role: 'project_manager' });
      await createTestProject({ owner: pm._id, members: [pm._id] });

      // Attempting to deactivate owner -> 409
      const deactRes = await request(app)
        .patch(`/api/users/${pm._id}/status`)
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`)
        .send({ status: 'inactive' });

      expect(deactRes.status).toBe(409);
      expect(deactRes.body.message).toMatch(/Transfer ownership/i);

      // Attempting to downgrade owner -> 409
      const roleRes = await request(app)
        .patch(`/api/users/${pm._id}/role`)
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`)
        .send({ role: 'team_member' });

      expect(roleRes.status).toBe(409);
      expect(roleRes.body.message).toMatch(/Transfer ownership/i);
    });

    it('allows Admin to transfer ownership, and permits downgrading/deactivating former owner afterwards', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const pm1 = await createTestUser({ role: 'project_manager' });
      const pm2 = await createTestUser({ role: 'project_manager' });
      const project = await createTestProject({ owner: pm1._id, members: [pm1._id, pm2._id] });

      // Transfer ownership to pm2
      const transferRes = await request(app)
        .patch(`/api/admin/projects/${project._id}/owner`)
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`)
        .send({ newOwnerId: pm2._id.toString() });

      expect(transferRes.status).toBe(200);
      expect(transferRes.body.data.project.owner._id.toString()).toBe(pm2._id.toString());

      // Former owner pm1 can now be safely deactivated
      const deactRes = await request(app)
        .patch(`/api/users/${pm1._id}/status`)
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`)
        .send({ status: 'inactive' });

      expect(deactRes.status).toBe(200);
      expect(deactRes.body.data.user.status).toBe('inactive');
    });
  });
});

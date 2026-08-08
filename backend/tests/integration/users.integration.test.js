const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const { createTestUser, getAuthToken } = require('../helpers/factories');

describe('User / RBAC Integration Tests (/api/users/*)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('GET /api/users', () => {
    it('allows Admin to list all users with pagination and without passwords', async () => {
      const admin = await createTestUser({ role: 'admin' });
      await createTestUser({ name: 'User 1', role: 'team_member' });
      await createTestUser({ name: 'User 2', role: 'project_manager' });

      const token = getAuthToken(admin._id);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(3);

      for (const u of res.body.data.users) {
        expect(u.password).toBeUndefined();
      }
    });

    it('denies Project Manager from listing all users with 403 Forbidden', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const token = getAuthToken(pm._id);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('denies Team Member from listing all users with 403 Forbidden', async () => {
      const tm = await createTestUser({ role: 'team_member' });
      const token = getAuthToken(tm._id);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('allows Admin to change user role to project_manager', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const targetUser = await createTestUser({ role: 'team_member' });

      const res = await request(app)
        .patch(`/api/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`)
        .send({ role: 'project_manager' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('project_manager');

      const inDb = await User.findById(targetUser._id);
      expect(inDb.role).toBe('project_manager');
    });

    it('prevents Admin from demoting themselves (self-protection)', async () => {
      const admin = await createTestUser({ role: 'admin' });

      const res = await request(app)
        .patch(`/api/users/${admin._id}/role`)
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`)
        .send({ role: 'team_member' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot remove their own admin role|cannot change your own role/i);
    });

    it('denies non-admin users from changing roles', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const targetUser = await createTestUser({ role: 'team_member' });

      const res = await request(app)
        .patch(`/api/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/users/:id/status', () => {
    it('allows Admin to deactivate a non-owner user', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const targetUser = await createTestUser({ role: 'team_member', status: 'active' });

      const res = await request(app)
        .patch(`/api/users/${targetUser._id}/status`)
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`)
        .send({ status: 'inactive' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.status).toBe('inactive');

      const inDb = await User.findById(targetUser._id);
      expect(inDb.status).toBe('inactive');
    });

    it('prevents Admin from deactivating themselves', async () => {
      const admin = await createTestUser({ role: 'admin' });

      const res = await request(app)
        .patch(`/api/users/${admin._id}/status`)
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`)
        .send({ status: 'inactive' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot deactivate their own account/i);
    });
  });

  describe('PATCH /api/users/me/profile', () => {
    it('allows user to update own name and profileImage', async () => {
      const user = await createTestUser({ name: 'Original Name', profileImage: '' });

      const res = await request(app)
        .patch('/api/users/me/profile')
        .set('Authorization', `Bearer ${getAuthToken(user._id)}`)
        .send({
          name: 'Updated Name',
          profileImage: 'https://example.com/avatar.png',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Updated Name');
      expect(res.body.data.user.profileImage).toBe('https://example.com/avatar.png');
    });

    it('ignores attempted privilege escalation (role, status, email) in profile update payload', async () => {
      const user = await createTestUser({
        name: 'Normal User',
        email: 'user@example.com',
        role: 'team_member',
        status: 'active',
      });

      const res = await request(app)
        .patch('/api/users/me/profile')
        .set('Authorization', `Bearer ${getAuthToken(user._id)}`)
        .send({
          name: 'New Name',
          role: 'admin',
          status: 'inactive',
          email: 'admin_injected@example.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('team_member');
      expect(res.body.data.user.status).toBe('active');
      expect(res.body.data.user.email).toBe('user@example.com');

      const inDb = await User.findById(user._id);
      expect(inDb.role).toBe('team_member');
      expect(inDb.status).toBe('active');
      expect(inDb.email).toBe('user@example.com');
    });
  });
});

const request = require('supertest');
const app = require('../../src/app');
const Project = require('../../src/models/Project');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const { createTestUser, createTestProject, getAuthToken } = require('../helpers/factories');

describe('Project Members Integration Tests (/api/projects/:id/members/*)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/projects/:id/members', () => {
    it('allows project owner to add an active user to members', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member', status: 'active' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id] });

      const res = await request(app)
        .post(`/api/projects/${project._id}/members`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({ userId: tm._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const inDb = await Project.findById(project._id);
      expect(inDb.members.map((m) => m.toString())).toContain(tm._id.toString());
    });

    it('returns 409 Conflict when adding a user who is already a member', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });

      const res = await request(app)
        .post(`/api/projects/${project._id}/members`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({ userId: tm._id.toString() });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already a member/i);
    });

    it('returns 400 Bad Request when attempting to add an inactive user', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const inactiveUser = await createTestUser({ role: 'team_member', status: 'inactive' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id] });

      const res = await request(app)
        .post(`/api/projects/${project._id}/members`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({ userId: inactiveUser._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Inactive users cannot be added/i);
    });

    it('denies non-owner Project Manager or Team Member with 403 Forbidden', async () => {
      const pmOwner = await createTestUser({ role: 'project_manager' });
      const pmOther = await createTestUser({ role: 'project_manager' });
      const tmCandidate = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pmOwner._id, members: [pmOwner._id] });

      const res = await request(app)
        .post(`/api/projects/${project._id}/members`)
        .set('Authorization', `Bearer ${getAuthToken(pmOther._id)}`)
        .send({ userId: tmCandidate._id.toString() });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/projects/:id/members/:userId', () => {
    it('allows owner to remove a member from the project', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });

      const res = await request(app)
        .delete(`/api/projects/${project._id}/members/${tm._id}`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);

      expect(res.status).toBe(200);

      const inDb = await Project.findById(project._id);
      expect(inDb.members.map((m) => m.toString())).not.toContain(tm._id.toString());
    });

    it('prevents removing the project owner with 400 Bad Request', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id] });

      const res = await request(app)
        .delete(`/api/projects/${project._id}/members/${pm._id}`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be removed|cannot remove the project owner/i);
    });
  });

  describe('GET /api/projects/:id/member-candidates', () => {
    it('returns active non-members and excludes existing members and inactive users', async () => {
      const pm = await createTestUser({ name: 'PM Owner', role: 'project_manager' });
      const memberTM = await createTestUser({ name: 'Active Member', role: 'team_member' });
      const candidateTM = await createTestUser({ name: 'Candidate TM', role: 'team_member', status: 'active' });
      await createTestUser({ name: 'Inactive User', role: 'team_member', status: 'inactive' });

      const project = await createTestProject({ owner: pm._id, members: [pm._id, memberTM._id] });

      const res = await request(app)
        .get(`/api/projects/${project._id}/member-candidates`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const candidates = res.body.data.users;
      const candidateIds = candidates.map((c) => c.id.toString());

      expect(candidateIds).toContain(candidateTM._id.toString());
      expect(candidateIds).not.toContain(memberTM._id.toString());
      expect(candidateIds).not.toContain(pm._id.toString());

      for (const c of candidates) {
        expect(c.password).toBeUndefined();
        expect(c.status).toBe('active');
      }
    });
  });
});

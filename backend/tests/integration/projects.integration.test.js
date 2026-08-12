const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Project = require('../../src/models/Project');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const { createTestUser, createTestProject, getAuthToken } = require('../helpers/factories');

describe('Project Integration Tests (/api/projects/*)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/projects', () => {
    it('allows Project Manager to create project with server-controlled owner and member assignment', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const token = getAuthToken(pm._id);

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Mobile App Revamp',
          description: 'Redesigning mobile UI',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe('Mobile App Revamp');
      expect(res.body.data.project.owner._id.toString()).toBe(pm._id.toString());
      expect(res.body.data.project.members.some((m) => m._id.toString() === pm._id.toString())).toBe(true);
    });

    it('allows Admin to create project', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`)
        .send({
          name: 'Admin Project',
          description: 'Created by Admin',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.project.owner._id.toString()).toBe(admin._id.toString());
    });

    it('denies Team Member from creating a project with 403 Forbidden', async () => {
      const tm = await createTestUser({ role: 'team_member' });
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${getAuthToken(tm._id)}`)
        .send({ name: 'Unauthorized Project' });

      expect(res.status).toBe(403);
    });

    it('ignores client attempts to inject custom owner or members list', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const otherUser = await createTestUser({ role: 'team_member' });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({
          name: 'Injected Project',
          description: 'Project description',
          owner: otherUser._id.toString(),
          members: [otherUser._id.toString()],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.project.owner._id.toString()).toBe(pm._id.toString());
    });
  });

  describe('GET /api/projects', () => {
    it('returns all projects for Admin, but only accessible projects for non-admin users', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const pmA = await createTestUser({ role: 'project_manager' });
      const pmB = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });

      const projectA = await createTestProject({ name: 'Project A', owner: pmA._id, members: [pmA._id, tm._id] });
      await createTestProject({ name: 'Project B', owner: pmB._id, members: [pmB._id] });

      // Admin sees both
      const adminRes = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.projects.length).toBe(2);

      // PM A sees only Project A
      const pmARes = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${getAuthToken(pmA._id)}`);
      expect(pmARes.status).toBe(200);
      expect(pmARes.body.data.projects.length).toBe(1);
      expect(pmARes.body.data.projects[0]._id.toString()).toBe(projectA._id.toString());

      // TM sees only Project A (as member)
      const tmRes = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${getAuthToken(tm._id)}`);
      expect(tmRes.status).toBe(200);
      expect(tmRes.body.data.projects.length).toBe(1);
      expect(tmRes.body.data.projects[0]._id.toString()).toBe(projectA._id.toString());
    });
  });

  describe('GET /api/projects/:id', () => {
    it('allows owner, member, and admin to view project details', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const tm = await createTestUser({ role: 'team_member' });
      const admin = await createTestUser({ role: 'admin' });

      const project = await createTestProject({ owner: pm._id, members: [pm._id, tm._id] });

      const ownerRes = await request(app)
        .get(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);
      expect(ownerRes.status).toBe(200);

      const memberRes = await request(app)
        .get(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${getAuthToken(tm._id)}`);
      expect(memberRes.status).toBe(200);

      const adminRes = await request(app)
        .get(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${getAuthToken(admin._id)}`);
      expect(adminRes.status).toBe(200);
    });

    it('denies outsider non-member with 403 Forbidden', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const outsider = await createTestUser({ role: 'team_member' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id] });

      const res = await request(app)
        .get(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${getAuthToken(outsider._id)}`);

      expect(res.status).toBe(403);
    });

    it('returns 400 for invalid ObjectId format', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const res = await request(app)
        .get('/api/projects/invalid-id-format')
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid project ID/i);
    });

    it('returns 404 for valid ObjectId that does not exist in DB', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH & DELETE /api/projects/:id', () => {
    it('allows owner to update and delete project', async () => {
      const pm = await createTestUser({ role: 'project_manager' });
      const project = await createTestProject({ owner: pm._id, members: [pm._id] });

      const updateRes = await request(app)
        .patch(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`)
        .send({ name: 'Updated Project Name' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.project.name).toBe('Updated Project Name');

      const deleteRes = await request(app)
        .delete(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${getAuthToken(pm._id)}`);

      expect(deleteRes.status).toBe(200);

      const inDb = await Project.findById(project._id);
      expect(inDb).toBeNull();
    });

    it('denies non-owner Project Manager from updating or deleting project', async () => {
      const pmOwner = await createTestUser({ role: 'project_manager' });
      const pmOther = await createTestUser({ role: 'project_manager' });
      const project = await createTestProject({ owner: pmOwner._id, members: [pmOwner._id, pmOther._id] });

      const updateRes = await request(app)
        .patch(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${getAuthToken(pmOther._id)}`)
        .send({ name: 'Hacked Name' });

      expect(updateRes.status).toBe(403);

      const deleteRes = await request(app)
        .delete(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${getAuthToken(pmOther._id)}`);

      expect(deleteRes.status).toBe(403);
    });
  });
});

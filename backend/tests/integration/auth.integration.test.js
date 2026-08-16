const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const { createTestUser, getAuthToken } = require('../helpers/factories');

describe('Auth Integration Tests (POST /api/auth/*, GET /api/auth/me)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/auth/register', () => {
    it('registers successfully when role is omitted and defaults to team_member', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alice Member',
        email: 'alice@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Alice Member');
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user.role).toBe('team_member');
      expect(res.body.data.user.status).toBe('active');
      expect(res.body.data.user.password).toBeUndefined();

      // Verify in DB
      const userInDb = await User.findOne({ email: 'alice@example.com' });
      expect(userInDb).not.toBeNull();
      expect(userInDb.role).toBe('team_member');
    });

    it('registers successfully when role is explicitly "team_member"', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Explicit Member',
        email: 'explicit@example.com',
        password: 'password123',
        role: 'team_member',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('team_member');
    });

    it('rejects registration with role "project_manager" with 400 Bad Request', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Attacker PM',
        email: 'attacker_pm@example.com',
        password: 'password123',
        role: 'project_manager',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/restricted to the team_member role/i);

      // Confirm no account was created
      const userInDb = await User.findOne({ email: 'attacker_pm@example.com' });
      expect(userInDb).toBeNull();
    });

    it('rejects registration with role "admin" with 400 Bad Request', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Attacker Admin',
        email: 'attacker_admin@example.com',
        password: 'password123',
        role: 'admin',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/restricted to the team_member role/i);

      // Confirm no account was created
      const userInDb = await User.findOne({ email: 'attacker_admin@example.com' });
      expect(userInDb).toBeNull();
    });

    it('returns 409 Conflict when attempting to register with an existing email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists|already registered/i);
    });

    it('returns 400 Bad Request when required registration fields are missing or invalid', async () => {
      const resMissing = await request(app).post('/api/auth/register').send({
        email: 'missingname@example.com',
        password: 'password123',
      });
      expect(resMissing.status).toBe(400);

      const resShortPw = await request(app).post('/api/auth/register').send({
        name: 'Short PW',
        email: 'shortpw@example.com',
        password: '123',
      });
      expect(resShortPw.status).toBe(400);
      expect(resShortPw.body.message).toMatch(/validation failed/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in active user with correct credentials and returns 200 with JWT', async () => {
      await createTestUser({
        email: 'login_user@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login_user@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('login_user@example.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('returns generic 401 when password is incorrect', async () => {
      await createTestUser({
        email: 'login_user@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login_user@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it('returns generic 401 when email does not exist in database', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it('returns 403 Forbidden when account is inactive', async () => {
      await createTestUser({
        email: 'inactive@example.com',
        password: 'password123',
        status: 'inactive',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'inactive@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Account is inactive/i);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 200 with current user profile for valid JWT without exposing password', async () => {
      const user = await createTestUser({
        name: 'Me User',
        email: 'me@example.com',
        role: 'project_manager',
      });
      const token = getAuthToken(user._id);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('me@example.com');
      expect(res.body.data.user.role).toBe('project_manager');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Authentication required|Not authorized|Token missing/i);
    });

    it('returns 401 when Authorization token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

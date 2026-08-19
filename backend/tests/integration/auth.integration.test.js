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

  describe('POST /api/auth/forgot-password', () => {
    it('returns 200 generic success for existing email and generates token', async () => {
      const user = await createTestUser({ email: 'forgot@example.com' });
      const res = await request(app).post('/api/auth/forgot-password').send({
        email: 'forgot@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/we have sent a password reset link/i);

      const dbUser = await User.findById(user._id).select('+resetPasswordToken +resetPasswordExpire');
      expect(dbUser.resetPasswordToken).toBeDefined();
      expect(dbUser.resetPasswordExpire).toBeDefined();
    });

    it('returns 200 generic success for unknown email to prevent enumeration', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({
        email: 'nobody@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/we have sent a password reset link/i);
    });

    it('returns 400 if email is missing', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('successfully resets password, invalidates old JWT, and clears token', async () => {
      const crypto = require('crypto');
      const user = await createTestUser({ email: 'reset@example.com', password: 'oldpassword123' });
      
      // Get old token
      const oldToken = getAuthToken(user._id);
      
      // Simulate forgot password to get token
      const resetToken = crypto.randomBytes(20).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      await User.findByIdAndUpdate(user._id, {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: Date.now() + 10 * 60 * 1000,
      });

      // Wait 1 second so the new JWT generated after reset has a strictly greater iat
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset password
      const res = await request(app).post('/api/auth/reset-password').send({
        token: resetToken,
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify db changes
      const dbUser = await User.findById(user._id).select('+password +resetPasswordToken +resetPasswordExpire +passwordChangedAt');
      expect(dbUser.resetPasswordToken).toBeUndefined();
      expect(dbUser.resetPasswordExpire).toBeUndefined();
      expect(dbUser.passwordChangedAt).toBeDefined();

      // Verify old password fails
      const loginFail = await request(app).post('/api/auth/login').send({
        email: 'reset@example.com',
        password: 'oldpassword123',
      });
      expect(loginFail.status).toBe(401);

      // Verify new password works
      const loginSuccess = await request(app).post('/api/auth/login').send({
        email: 'reset@example.com',
        password: 'newpassword456',
      });
      expect(loginSuccess.status).toBe(200);

      // Verify old JWT fails
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${oldToken}`);
      expect(meRes.status).toBe(401);
    });

    it('rejects invalid token', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'invalid-token-123',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid or expired token/i);
    });

    it('rejects expired token', async () => {
      const crypto = require('crypto');
      const user = await createTestUser();
      const resetToken = crypto.randomBytes(20).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      await User.findByIdAndUpdate(user._id, {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: Date.now() - 1000, // Expired
      });

      const res = await request(app).post('/api/auth/reset-password').send({
        token: resetToken,
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid or expired token/i);
    });

    it('validates password constraints', async () => {
      const crypto = require('crypto');
      const user = await createTestUser();
      const resetToken = crypto.randomBytes(20).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      await User.findByIdAndUpdate(user._id, {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: Date.now() + 10000,
      });

      const res1 = await request(app).post('/api/auth/reset-password').send({
        token: resetToken,
        newPassword: 'short',
        confirmPassword: 'short',
      });
      expect(res1.status).toBe(400);
      expect(res1.body.errors.newPassword).toBeDefined();

      const res2 = await request(app).post('/api/auth/reset-password').send({
        token: resetToken,
        newPassword: 'newpassword456',
        confirmPassword: 'mismatch456',
      });
      expect(res2.status).toBe(400);
      expect(res2.body.errors.confirmPassword).toBeDefined();
    });
  });
});

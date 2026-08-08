const request = require('supertest');
const app = require('../../src/app');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const { createTestUser, getAuthToken } = require('../helpers/factories');

describe('Errors & Security Hardening Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('returns standardized 404 JSON for unknown routes', async () => {
    const res = await request(app).get('/api/completely-unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Route not found');
  });

  it('returns 400 JSON for malformed JSON request bodies', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{ "email": "broken_json, ');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid JSON payload/i);
  });

  it('returns 400 JSON for invalid pagination parameters', async () => {
    const admin = await createTestUser({ role: 'admin' });

    const res = await request(app)
      .get('/api/users?page=-5')
      .set('Authorization', `Bearer ${getAuthToken(admin._id)}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid page/i);
  });

  it('returns 400 JSON for invalid enum query filter values', async () => {
    const admin = await createTestUser({ role: 'admin' });

    const res = await request(app)
      .get('/api/users?role=super_hacker')
      .set('Authorization', `Bearer ${getAuthToken(admin._id)}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid role/i);
  });

  it('includes standard Helmet HTTP security headers in responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('applies rate limiter headers on authentication endpoints', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    const hasRateLimitHeader =
      res.headers['ratelimit-limit'] !== undefined ||
      res.headers['x-ratelimit-limit'] !== undefined ||
      res.headers['ratelimit-remaining'] !== undefined ||
      res.headers['x-ratelimit-remaining'] !== undefined;

    expect(hasRateLimitHeader).toBe(true);
  });

  it('recursively ensures sensitive fields (passwords, secrets) are never present in user responses', async () => {
    const user = await createTestUser({
      name: 'Scan User',
      email: 'scan@example.com',
      password: 'super_secret_password_123',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${getAuthToken(user._id)}`);

    expect(res.status).toBe(200);

    const hasSensitiveKey = (obj) => {
      if (!obj || typeof obj !== 'object') return false;
      for (const [key, val] of Object.entries(obj)) {
        if (key === 'password' || key === 'passwordHash' || key === 'secret') return true;
        if (typeof val === 'string' && val.includes('super_secret_password_123')) return true;
        if (typeof val === 'object' && hasSensitiveKey(val)) return true;
      }
      return false;
    };

    expect(hasSensitiveKey(res.body)).toBe(false);
  });
});

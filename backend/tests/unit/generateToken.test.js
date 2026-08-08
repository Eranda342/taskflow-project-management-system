const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const generateToken = require('../../src/utils/generateToken');

describe('JWT Token Generation Utility (src/utils/generateToken.js)', () => {
  const originalSecret = process.env.JWT_SECRET;
  const mockSecret = 'test_jwt_secret_key_12345';

  beforeAll(() => {
    process.env.JWT_SECRET = mockSecret;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('generates a valid signed JWT containing the expected userId in payload', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const token = generateToken(userId);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = jwt.verify(token, mockSecret);
    expect(decoded.userId).toBe(userId);
  });

  it('sets token expiration and does not expose passwords, emails, or roles in payload', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const token = generateToken(userId);

    const decoded = jwt.decode(token);

    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
    expect(decoded.password).toBeUndefined();
    expect(decoded.email).toBeUndefined();
    expect(decoded.role).toBeUndefined();
  });
});

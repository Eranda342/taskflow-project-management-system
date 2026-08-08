const { notFoundHandler, errorHandler } = require('../../src/middleware/errorMiddleware');

describe('Error Handling Middleware (src/middleware/errorMiddleware.js)', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockReq = {
      originalUrl: '/api/test-route',
      method: 'GET',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  describe('notFoundHandler', () => {
    it('returns a standard 404 response with success: false and route message', () => {
      notFoundHandler(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Route not found',
      });
    });
  });

  describe('errorHandler', () => {
    it('handles generic application errors with custom status codes and messages', () => {
      const err = new Error('Task title cannot be empty');
      err.statusCode = 400;

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Task title cannot be empty',
      });
    });

    it('defaults to 500 status code and "Internal server error" when error has no statusCode or message', () => {
      const err = {};

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });

    it('handles malformed JSON body SyntaxError with 400 and clear message', () => {
      const err = new SyntaxError('Unexpected token in JSON');
      err.status = 400;
      err.body = '{ "name": ';

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid JSON payload',
      });
    });

    it('handles Mongoose CastError with path and value', () => {
      const err = new Error('Cast to ObjectId failed');
      err.name = 'CastError';
      err.path = '_id';
      err.value = 'invalid-object-id';

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid _id: invalid-object-id',
      });
    });

    it('handles Mongoose CastError when path and value are undefined', () => {
      const err = new Error('Cast to ObjectId failed');
      err.name = 'CastError';

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid ID: ',
      });
    });

    it('handles Mongoose ValidationError and aggregates validation field messages with 400 status', () => {
      const err = new Error('Validation failed');
      err.name = 'ValidationError';
      err.errors = {
        title: { message: 'Title is required' },
        status: { message: 'Invalid status' },
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Title is required, Invalid status',
      });
    });

    it('handles MongoDB duplicate key error (code 11000) with key field name', () => {
      const err = new Error('E11000 duplicate key error');
      err.code = 11000;
      err.keyValue = { email: 'duplicate@example.com' };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already exists',
      });
    });

    it('handles MongoDB duplicate key error (code 11000) when keyValue is undefined', () => {
      const err = new Error('E11000 duplicate key error');
      err.code = 11000;

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate field value entered',
      });
    });

    it('handles JWT JsonWebTokenError with 401 unauthorized status', () => {
      const err = new Error('jwt malformed');
      err.name = 'JsonWebTokenError';

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
      });
    });

    it('handles JWT TokenExpiredError with 401 unauthorized status', () => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired',
      });
    });

    it('sanitizes 500 error messages in production mode to prevent information leakage', () => {
      process.env.NODE_ENV = 'production';
      const sensitiveErr = new Error('MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017');

      errorHandler(sensitiveErr, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });
});

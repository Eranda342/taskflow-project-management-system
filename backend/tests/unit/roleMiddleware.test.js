const { ROLES } = require('../../src/utils/roles');
const { authorizeRoles } = require('../../src/middleware/roleMiddleware');

describe('Role Authorization Middleware (src/middleware/roleMiddleware.js)', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      user: null,
      body: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('allows access and calls next() when user has an allowed role (admin)', () => {
    mockReq.user = { _id: 'admin123', role: ROLES.ADMIN };
    const middleware = authorizeRoles(ROLES.ADMIN);

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('allows access and calls next() when route allows multiple roles and user has one', () => {
    mockReq.user = { _id: 'pm123', role: ROLES.PROJECT_MANAGER };
    const middleware = authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER);

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('supports role arrays passed into authorizeRoles ([ROLES.ADMIN, ROLES.PROJECT_MANAGER])', () => {
    mockReq.user = { _id: 'pm123', role: ROLES.PROJECT_MANAGER };
    const middleware = authorizeRoles([ROLES.ADMIN, ROLES.PROJECT_MANAGER]);

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when user role is not authorized for the route', () => {
    mockReq.user = { _id: 'tm123', role: ROLES.TEAM_MEMBER };
    const middleware = authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER);

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'You do not have permission to perform this action',
    });
  });

  it('returns 401 when req.user is missing from request (unauthenticated)', () => {
    mockReq.user = null;
    const middleware = authorizeRoles(ROLES.ADMIN);

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication required',
    });
  });

  it('ignores and rejects spoofed role attempts in request body or query params', () => {
    mockReq.user = { _id: 'tm123', role: ROLES.TEAM_MEMBER };
    mockReq.body = { role: 'admin' };
    mockReq.query = { role: 'admin' };

    const middleware = authorizeRoles(ROLES.ADMIN);

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'You do not have permission to perform this action',
    });
  });
});

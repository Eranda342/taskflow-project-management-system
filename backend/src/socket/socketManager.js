const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const { canViewProject } = require('../utils/projectAccess');

let io = null;

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const allowedOrigins = [
  'http://localhost:3000',
];
if (CLIENT_URL && !allowedOrigins.includes(CLIENT_URL)) {
  allowedOrigins.push(CLIENT_URL);
}

/**
 * Socket.IO authentication middleware
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    // Fallback to authorization header if provided
    if (!token && socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return next(new Error('Authentication error'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new Error('Authentication error'));
    }

    if (!decoded || !decoded.userId) {
      return next(new Error('Authentication error'));
    }

    const user = await User.findById(decoded.userId).select(
      '_id name email role status profileImage'
    );

    if (!user) {
      return next(new Error('Authentication error'));
    }

    if (user.status !== 'active') {
      return next(new Error('Authentication error'));
    }

    socket.user = user;
    next();
  } catch (error) {
    return next(new Error('Authentication error'));
  }
};

/**
 * Initialize Socket.IO with the HTTP server
 * @param {import('http').Server} server
 * @param {Object} [customCors]
 * @returns {Server}
 */
const initSocket = (server, customCors) => {
  io = new Server(server, {
    cors: customCors || {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${socket.id} (User: ${userId})`);

    // Automatically join the authenticated user's private room
    const userRoom = `user:${userId}`;
    socket.join(userRoom);

    // Handle joining a project room
    socket.on('project:join', async (data, callback) => {
      try {
        const projectId = data?.projectId;

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
          if (typeof callback === 'function') {
            return callback({ success: false, message: 'Invalid project ID' });
          }
          return socket.emit('error', { message: 'Invalid project ID' });
        }

        const project = await Project.findById(projectId);

        if (!project) {
          if (typeof callback === 'function') {
            return callback({ success: false, message: 'Project not found' });
          }
          return socket.emit('error', { message: 'Project not found' });
        }

        if (!canViewProject(project, socket.user)) {
          if (typeof callback === 'function') {
            return callback({
              success: false,
              message: 'You do not have access to this project',
            });
          }
          return socket.emit('error', {
            message: 'You do not have access to this project',
          });
        }

        const projectRoom = `project:${projectId}`;
        socket.join(projectRoom);

        if (typeof callback === 'function') {
          return callback({ success: true, projectId });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          return callback({ success: false, message: 'Internal server error' });
        }
      }
    });

    // Handle leaving a project room
    socket.on('project:leave', (data, callback) => {
      try {
        const projectId = data?.projectId;
        if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
          socket.leave(`project:${projectId}`);
        }
        if (typeof callback === 'function') {
          callback({ success: true });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ success: false });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get the current Socket.IO instance
 * @returns {Server|null}
 */
const getIO = () => io;

/**
 * Emit an event to a project room
 * @param {string|mongoose.Types.ObjectId} projectId
 * @param {string} eventName
 * @param {Object} payload
 */
const emitToProject = (projectId, eventName, payload) => {
  if (!io || !projectId) return;
  const projectRoom = `project:${projectId._id ? projectId._id.toString() : projectId.toString()}`;
  io.to(projectRoom).emit(eventName, payload);
};

/**
 * Emit an event to a user's personal room
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string} eventName
 * @param {Object} payload
 */
const emitToUser = (userId, eventName, payload) => {
  if (!io || !userId) return;
  const userRoom = `user:${userId._id ? userId._id.toString() : userId.toString()}`;
  io.to(userRoom).emit(eventName, payload);
};

/**
 * Remove all active sockets of a user from a project room
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string|mongoose.Types.ObjectId} projectId
 */
const removeUserFromProjectRoom = (userId, projectId) => {
  if (!io || !userId || !projectId) return;
  const userRoom = `user:${userId._id ? userId._id.toString() : userId.toString()}`;
  const projectRoom = `project:${projectId._id ? projectId._id.toString() : projectId.toString()}`;
  io.in(userRoom).socketsLeave(projectRoom);
};

/**
 * Add all active sockets of a user into a project room
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string|mongoose.Types.ObjectId} projectId
 */
const addUserToProjectRoom = (userId, projectId) => {
  if (!io || !userId || !projectId) return;
  const userRoom = `user:${userId._id ? userId._id.toString() : userId.toString()}`;
  const projectRoom = `project:${projectId._id ? projectId._id.toString() : projectId.toString()}`;
  io.in(userRoom).socketsJoin(projectRoom);
};

/**
 * Evict all sockets from a project room (e.g. upon project deletion)
 * @param {string|mongoose.Types.ObjectId} projectId
 */
const closeProjectRoom = (projectId) => {
  if (!io || !projectId) return;
  const projectRoom = `project:${projectId._id ? projectId._id.toString() : projectId.toString()}`;
  io.in(projectRoom).socketsLeave(projectRoom);
};

module.exports = {
  initSocket,
  getIO,
  emitToProject,
  emitToUser,
  removeUserFromProjectRoom,
  addUserToProjectRoom,
  closeProjectRoom,
};

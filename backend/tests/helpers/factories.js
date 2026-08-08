const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const Project = require('../../src/models/Project');
const Task = require('../../src/models/Task');
const Comment = require('../../src/models/Comment');
const Notification = require('../../src/models/Notification');

/**
 * Generate a JWT token for a given user ID
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {string}
 */
const getAuthToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
  return jwt.sign({ userId: userId.toString() }, secret, { expiresIn: '7d' });
};

/**
 * Factory to create a test user with properly hashed password
 * @param {Object} data
 * @returns {Promise<import('../../src/models/User')>}
 */
const createTestUser = async (data = {}) => {
  const uniqueSuffix = Date.now() + '_' + Math.floor(Math.random() * 100000);
  const password = data.password || 'password123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return await User.create({
    name: data.name || `Test User ${uniqueSuffix}`,
    email: data.email || `test_${uniqueSuffix}@example.com`,
    password: hashedPassword,
    role: data.role || 'team_member',
    status: data.status || 'active',
    profileImage: data.profileImage || '',
  });
};

/**
 * Factory to create a test project
 * @param {Object} data
 * @returns {Promise<import('../../src/models/Project')>}
 */
const createTestProject = async (data = {}) => {
  const uniqueSuffix = Date.now() + '_' + Math.floor(Math.random() * 100000);
  const owner = data.owner;
  const members = data.members || (owner ? [owner] : []);

  return await Project.create({
    name: data.name || `Test Project ${uniqueSuffix}`,
    description: data.description || 'Test project description',
    owner,
    members,
    status: data.status || 'active',
  });
};

/**
 * Factory to create a test task
 * @param {Object} data
 * @returns {Promise<import('../../src/models/Task')>}
 */
const createTestTask = async (data = {}) => {
  const uniqueSuffix = Date.now() + '_' + Math.floor(Math.random() * 100000);
  return await Task.create({
    title: data.title || `Test Task ${uniqueSuffix}`,
    description: data.description || 'Test task description',
    project: data.project,
    createdBy: data.createdBy,
    assignedTo: data.assignedTo || null,
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    dueDate: data.dueDate || null,
  });
};

module.exports = {
  getAuthToken,
  createTestUser,
  createTestProject,
  createTestTask,
};

const { ROLES } = require('./roles');

/**
 * Check if a user is the owner of a project
 * @param {Object} project - Project document or object with owner
 * @param {string|import('mongoose').Types.ObjectId} userId - User ObjectId or string
 * @returns {boolean}
 */
const isProjectOwner = (project, userId) => {
  if (!project || !project.owner || !userId) return false;
  const ownerId = project.owner._id ? project.owner._id : project.owner;
  const targetId = userId._id ? userId._id : userId;
  return ownerId.toString() === targetId.toString();
};

/**
 * Check if a user is a member of a project
 * @param {Object} project - Project document or object with members array
 * @param {string|import('mongoose').Types.ObjectId} userId - User ObjectId or string
 * @returns {boolean}
 */
const isProjectMember = (project, userId) => {
  if (!project || !Array.isArray(project.members) || !userId) return false;
  const targetId = (userId._id ? userId._id : userId).toString();
  return project.members.some((member) => {
    const memberId = (member._id ? member._id : member).toString();
    return memberId === targetId;
  });
};

/**
 * Check if a user can view a project (Admin, Owner, or Member)
 * @param {Object} project - Project document
 * @param {Object} user - Authenticated user object (req.user)
 * @returns {boolean}
 */
const canViewProject = (project, user) => {
  if (!project || !user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return isProjectOwner(project, user._id) || isProjectMember(project, user._id);
};

/**
 * Check if a user can manage project members / update / delete (Admin or Project Owner)
 * @param {Object} project - Project document
 * @param {Object} user - Authenticated user object (req.user)
 * @returns {boolean}
 */
const canManageProject = (project, user) => {
  if (!project || !user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return isProjectOwner(project, user._id);
};

module.exports = {
  isProjectOwner,
  isProjectMember,
  canViewProject,
  canManageProject,
};

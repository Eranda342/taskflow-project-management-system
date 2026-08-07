const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token containing only the user's ID
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = generateToken;

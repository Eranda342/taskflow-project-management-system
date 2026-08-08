'use strict';
/**
 * Socket Client Helpers for System Tests
 *
 * Provides:
 *   connectSocket(baseUrl, token)        — connect + authenticate
 *   joinProjectRoom(socket, projectId)  — join a project room via callback
 *   waitForEvent(socket, eventName, ms) — promise that resolves on next event
 *   disconnectSocket(socket)            — clean disconnect
 */

const { io: ioClient } = require('socket.io-client');

const DEFAULT_TIMEOUT_MS = 4000;

/**
 * Connect a socket.io-client and wait until it is connected.
 * @param {string} baseUrl
 * @param {string} token  — JWT for socket auth
 * @returns {Promise<import('socket.io-client').Socket>}
 */
const connectSocket = (baseUrl, token) =>
  new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
      timeout: DEFAULT_TIMEOUT_MS,
    });

    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error(`connectSocket timed out after ${DEFAULT_TIMEOUT_MS}ms`));
    }, DEFAULT_TIMEOUT_MS);

    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      socket.disconnect();
      reject(new Error(`Socket connect_error: ${err.message}`));
    });
  });

/**
 * Emit project:join and await the server callback.
 * @param {import('socket.io-client').Socket} socket
 * @param {string} projectId
 * @param {number} [timeoutMs]
 * @returns {Promise<{success: boolean, projectId?: string, message?: string}>}
 */
const joinProjectRoom = (socket, projectId, timeoutMs = DEFAULT_TIMEOUT_MS) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`joinProjectRoom timed out for ${projectId}`));
    }, timeoutMs);

    socket.emit('project:join', { projectId }, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });

/**
 * Wait for the next occurrence of a named Socket.IO event.
 * @param {import('socket.io-client').Socket} socket
 * @param {string} eventName
 * @param {number} [timeoutMs]
 * @returns {Promise<any>}
 */
const waitForEvent = (socket, eventName, timeoutMs = DEFAULT_TIMEOUT_MS) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      // eslint-disable-next-line no-use-before-define
      socket.off(eventName, handler);
      reject(new Error(`waitForEvent("${eventName}") timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    function handler(data) {
      clearTimeout(timer);
      resolve(data);
    }

    socket.once(eventName, handler);
  });

/**
 * Cleanly disconnect a socket, waiting for the disconnect event.
 * @param {import('socket.io-client').Socket} socket
 * @returns {Promise<void>}
 */
const disconnectSocket = (socket) =>
  new Promise((resolve) => {
    if (!socket || !socket.connected) return resolve();
    socket.once('disconnect', resolve);
    socket.disconnect();
  });

module.exports = {
  connectSocket,
  joinProjectRoom,
  waitForEvent,
  disconnectSocket,
};

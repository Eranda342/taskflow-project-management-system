'use strict';
/**
 * System Test Server Helper
 *
 * Creates a real HTTP + Socket.IO server bound to an ephemeral OS-assigned
 * port from the existing Express app and socketManager — identical to
 * production boot, but without importing src/server.js (which auto-starts).
 *
 * The caller is responsible for:
 *   1. Connecting Mongoose to MONGO_URI_TEST before calling startSystemServer()
 *   2. Calling stopSystemServer() in afterAll()
 */

const http = require('http');
const app  = require('../../src/app');
const { initSocket } = require('../../src/socket/socketManager');

let _server = null;
let _baseUrl = null;

/**
 * Start an HTTP + Socket.IO server on an ephemeral port.
 * @returns {Promise<{server: http.Server, baseUrl: string, port: number}>}
 */
const startSystemServer = () =>
  new Promise((resolve, reject) => {
    const server = http.createServer(app);

    // Re-initialise Socket.IO on this test server instance.
    // customCors: '*' so socket.io-client can connect without CORS issues.
    initSocket(server, { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] });

    // Port 0 → OS picks a free ephemeral port
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      _server  = server;
      _baseUrl = `http://127.0.0.1:${port}`;
      resolve({ server, baseUrl: _baseUrl, port });
    });

    server.once('error', reject);
  });

/**
 * Stop the system server cleanly (closes HTTP connections & Socket.IO).
 * @returns {Promise<void>}
 */
const stopSystemServer = () =>
  new Promise((resolve) => {
    if (!_server) return resolve();
    _server.close(() => {
      _server  = null;
      _baseUrl = null;
      resolve();
    });
  });

/**
 * Return the current base URL (set after startSystemServer resolves).
 * @returns {string}
 */
const getBaseUrl = () => _baseUrl;

module.exports = { startSystemServer, stopSystemServer, getBaseUrl };

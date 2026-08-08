'use strict';
/**
 * B18 Test-Quality Verification Suite
 *
 * Addresses two specific quality gaps in the primary system test:
 *
 * 1. DUPLICATE-EVENT COUNTING
 *    Uses socket.on (not socket.once) to collect ALL matching event payloads
 *    in a receiving array. After the first event arrives, a bounded extra
 *    observation window waits for any duplicate. Asserts array.length === 1.
 *
 * 2. DIRECT PERSISTENCE-BEFORE-REALTIME
 *    Queries the test database from INSIDE the Socket.IO event handler
 *    callback before the handler resolves. Proves MongoDB write committed
 *    before the realtime event fired.
 *
 * This file runs as a standalone system test suite (tests/system/).
 * It sets up its own isolated server, users, project, and sockets.
 *
 * @file quality.system.test.js
 */

require('dotenv').config();
const request    = require('supertest');
const mongoose   = require('mongoose');
const Task         = require('../../src/models/Task');
const Comment      = require('../../src/models/Comment');
const Notification = require('../../src/models/Notification');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const { createTestUser, getAuthToken }                 = require('../helpers/factories');
const { startSystemServer, stopSystemServer }          = require('../helpers/systemServer');
const { connectSocket, joinProjectRoom, disconnectSocket } = require('../helpers/socketClient');

// ──────────────────────────────────────────────────────────────────────────────
// Local helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Attach a persistent socket.on listener before a mutation.
 * Waits until the first event arrives, then waits an extra bounded window
 * for any duplicate events. Returns ALL collected payloads.
 *
 * This is the ONLY correct way to detect duplicates:
 *   socket.once proves at most ONE handler fires, but does not prove
 *   the server didn't emit a second event.
 *   socket.on with array collection proves the exact count of emissions.
 *
 * @param {import('socket.io-client').Socket} socket
 * @param {string} eventName
 * @param {{ firstTimeoutMs?: number, extraWindowMs?: number }} opts
 * @returns {Promise<any[]>}
 */
const collectAllEvents = async (socket, eventName, { firstTimeoutMs = 5000, extraWindowMs = 500 } = {}) => {
  const received = [];

  // Persistent listener — captures ALL events including duplicates
  const persistentListener = (data) => received.push(data);
  socket.on(eventName, persistentListener);

  try {
    // Wait for the first event using a separate once-based promise
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`collectAllEvents("${eventName}") timeout after ${firstTimeoutMs}ms`)),
        firstTimeoutMs
      );
      socket.once(eventName, () => {
        clearTimeout(timer);
        resolve();
      });
    });

    // Bounded extra observation window: server has time to emit a second duplicate
    await new Promise((r) => setTimeout(r, extraWindowMs));
  } finally {
    // Always remove the persistent listener after the window closes
    socket.off(eventName, persistentListener);
  }

  return received;
};

/**
 * Attach a socket.once handler that queries the TEST database from INSIDE
 * the handler, before the handler resolves. Returns a Promise that resolves
 * with { eventPayload, dbDocument } proving DB existence at the moment of event.
 *
 * @param {import('socket.io-client').Socket} socket
 * @param {string} eventName
 * @param {(payload: any) => Promise<any>} dbQueryFn - async fn that queries DB
 * @param {{ timeoutMs?: number }} opts
 * @returns {Promise<{ eventPayload: any, dbDocument: any }>}
 */
const captureEventWithDbQuery = (socket, eventName, dbQueryFn, { timeoutMs = 5000 } = {}) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`captureEventWithDbQuery("${eventName}") timeout after ${timeoutMs}ms`)),
      timeoutMs
    );

    socket.once(eventName, async (payload) => {
      clearTimeout(timer);
      try {
        // DB query runs INSIDE the event handler — proves persistence happened first
        const dbDocument = await dbQueryFn(payload);
        resolve({ eventPayload: payload, dbDocument });
      } catch (err) {
        reject(err);
      }
    });
  });

// ──────────────────────────────────────────────────────────────────────────────
// Suite-level state
// ──────────────────────────────────────────────────────────────────────────────
let baseUrl;
let qPm, qTm;
let qPmToken, qTmToken;
let qPmSocket, qTmSocket;
let qProjectId, qTaskId;

// ──────────────────────────────────────────────────────────────────────────────
// Setup / teardown
// ──────────────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await connectTestDb();
  const { baseUrl: url } = await startSystemServer();
  baseUrl = url;

  // Create isolated users
  qPm = await createTestUser({ role: 'project_manager', name: 'Quality PM' });
  qTm = await createTestUser({ role: 'team_member',     name: 'Quality TM' });
  qPmToken = getAuthToken(qPm._id);
  qTmToken = getAuthToken(qTm._id);

  // PM creates quality project
  const projRes = await request(baseUrl)
    .post('/api/projects')
    .set('Authorization', `Bearer ${qPmToken}`)
    .send({ name: 'Quality Verification Project', description: 'B18 quality suite' });
  expect(projRes.status).toBe(201);
  qProjectId = projRes.body.data.project._id;

  // Add TM to project
  const addRes = await request(baseUrl)
    .post(`/api/projects/${qProjectId}/members`)
    .set('Authorization', `Bearer ${qPmToken}`)
    .send({ userId: qTm._id.toString() });
  expect(addRes.status).toBe(200);

  // Create first task for status/assignment tests
  const taskRes = await request(baseUrl)
    .post(`/api/projects/${qProjectId}/tasks`)
    .set('Authorization', `Bearer ${qPmToken}`)
    .send({ title: 'Quality Task', description: 'Used in quality tests', priority: 'medium' });
  expect(taskRes.status).toBe(201);
  qTaskId = taskRes.body.data.task._id;

  // Connect both sockets and join project room
  qPmSocket = await connectSocket(baseUrl, qPmToken);
  qTmSocket = await connectSocket(baseUrl, qTmToken);
  await joinProjectRoom(qPmSocket, qProjectId);
  await joinProjectRoom(qTmSocket, qProjectId);
}, 30000);

afterAll(async () => {
  await disconnectSocket(qPmSocket).catch(() => {});
  await disconnectSocket(qTmSocket).catch(() => {});
  await stopSystemServer();
  await cleanTestDb();
  await disconnectTestDb();
}, 20000);

// ──────────────────────────────────────────────────────────────────────────────
// QUALITY 1: EXACT DUPLICATE-EVENT COUNTING
//
// For each mutation: attach socket.on collectors BEFORE the REST call,
// wait for first event, hold an extra 500ms observation window, assert
// array.length === 1 for each socket that should receive the event.
// ──────────────────────────────────────────────────────────────────────────────
describe('Quality 1 — Duplicate-Event Counting (socket.on array collection)', () => {
  it('task assignment: exactly 1 task:updated per connected project client', async () => {
    // First assign TM to the quality task so we can reassign
    await request(baseUrl)
      .patch(`/api/tasks/${qTaskId}/assign`)
      .set('Authorization', `Bearer ${qPmToken}`)
      .send({ userId: qTm._id.toString() });

    // Create a fresh task for a clean assignment
    const freshRes = await request(baseUrl)
      .post(`/api/projects/${qProjectId}/tasks`)
      .set('Authorization', `Bearer ${qPmToken}`)
      .send({ title: 'Assignment Dup Test Task', description: 'dup test', priority: 'low' });
    expect(freshRes.status).toBe(201);
    const dupTaskId = freshRes.body.data.task._id;

    // Drain any pending task:created events from both sockets before next test
    await new Promise((r) => setTimeout(r, 100));
    qPmSocket.removeAllListeners('task:created');
    qTmSocket.removeAllListeners('task:created');

    // Start collecting BEFORE the REST call
    const pmCollect = collectAllEvents(qPmSocket, 'task:updated');
    const tmCollect = collectAllEvents(qTmSocket, 'task:updated');

    const assignRes = await request(baseUrl)
      .patch(`/api/tasks/${dupTaskId}/assign`)
      .set('Authorization', `Bearer ${qPmToken}`)
      .send({ userId: qTm._id.toString() });
    expect(assignRes.status).toBe(200);

    const [pmEvents, tmEvents] = await Promise.all([pmCollect, tmCollect]);

    // EXACTLY 1 — not 0, not 2+
    expect(pmEvents).toHaveLength(1);
    expect(tmEvents).toHaveLength(1);
    expect(pmEvents[0].changeType).toBe('assignment');
    expect(tmEvents[0].changeType).toBe('assignment');
    expect(pmEvents[0].task._id.toString()).toBe(dupTaskId.toString());
    expect(tmEvents[0].task._id.toString()).toBe(dupTaskId.toString());
  });

  it('task status update: exactly 1 task:updated per connected project client', async () => {
    // Use quality task (already assigned to TM)
    const pmCollect = collectAllEvents(qPmSocket, 'task:updated');
    const tmCollect = collectAllEvents(qTmSocket, 'task:updated');

    const statusRes = await request(baseUrl)
      .patch(`/api/tasks/${qTaskId}/status`)
      .set('Authorization', `Bearer ${qTmToken}`)
      .send({ status: 'in_progress' });
    expect(statusRes.status).toBe(200);

    const [pmEvents, tmEvents] = await Promise.all([pmCollect, tmCollect]);

    expect(pmEvents).toHaveLength(1);
    expect(tmEvents).toHaveLength(1);
    expect(pmEvents[0].changeType).toBe('status');
    expect(tmEvents[0].changeType).toBe('status');
    expect(pmEvents[0].task.status).toBe('in_progress');
    expect(tmEvents[0].task.status).toBe('in_progress');
  });

  it('comment creation: exactly 1 comment:new per connected project client', async () => {
    const pmCollect = collectAllEvents(qPmSocket, 'comment:new');
    const tmCollect = collectAllEvents(qTmSocket, 'comment:new');

    const commentRes = await request(baseUrl)
      .post(`/api/tasks/${qTaskId}/comments`)
      .set('Authorization', `Bearer ${qTmToken}`)
      .send({ message: 'Duplicate-event quality verification comment' });
    expect(commentRes.status).toBe(201);

    const [pmEvents, tmEvents] = await Promise.all([pmCollect, tmCollect]);

    expect(pmEvents).toHaveLength(1);
    expect(tmEvents).toHaveLength(1);
    expect(pmEvents[0].comment._id).toBeDefined();
    expect(tmEvents[0].comment._id.toString()).toBe(pmEvents[0].comment._id.toString());
  });

  it('private task assignment notification: exactly 1 notification:new for intended recipient (TM)', async () => {
    // Create a fresh task to trigger a fresh assignment notification
    const freshRes = await request(baseUrl)
      .post(`/api/projects/${qProjectId}/tasks`)
      .set('Authorization', `Bearer ${qPmToken}`)
      .send({ title: 'Notif Dup Test Task', description: 'notification dup test', priority: 'low' });
    expect(freshRes.status).toBe(201);
    const notifTaskId = freshRes.body.data.task._id;

    // Drain task:created events so they don't interfere
    await new Promise((r) => setTimeout(r, 100));
    qPmSocket.removeAllListeners('task:created');
    qTmSocket.removeAllListeners('task:created');

    // Collect notification:new ONLY on TM personal room
    const tmNotifCollect = collectAllEvents(qTmSocket, 'notification:new');

    // PM assigns to TM — this triggers exactly one notification:new to TM's user room
    const assignRes = await request(baseUrl)
      .patch(`/api/tasks/${notifTaskId}/assign`)
      .set('Authorization', `Bearer ${qPmToken}`)
      .send({ userId: qTm._id.toString() });
    expect(assignRes.status).toBe(200);

    const tmNotifEvents = await tmNotifCollect;

    // EXACTLY 1 private notification:new for TM
    expect(tmNotifEvents).toHaveLength(1);
    expect(tmNotifEvents[0].notification.type).toBe('task_assigned');
    expect(tmNotifEvents[0].notification.recipient.toString()).toBe(qTm._id.toString());
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// QUALITY 2: DIRECT PERSISTENCE-BEFORE-REALTIME
//
// The Socket.IO event handler itself queries the test database.
// The document must exist at the exact moment the event fires.
// This proves: DB write → THEN → Socket.IO emission.
// ──────────────────────────────────────────────────────────────────────────────
describe('Quality 2 — Direct Persistence-Before-Realtime (DB query inside event handler)', () => {
  it('task:created — Task document exists in DB inside the event handler before handler resolves', async () => {
    // Register the capture handler BEFORE the REST call
    const capturePromise = captureEventWithDbQuery(
      qPmSocket,
      'task:created',
      async (payload) => {
        // This runs INSIDE the socket.io event callback
        // If the write had not committed yet, findById returns null
        return Task.findById(payload.task._id).lean();
      }
    );

    // Trigger the REST mutation
    const res = await request(baseUrl)
      .post(`/api/projects/${qProjectId}/tasks`)
      .set('Authorization', `Bearer ${qPmToken}`)
      .send({ title: 'PBR: Task Created', description: 'persistence-before-realtime probe', priority: 'high' });
    expect(res.status).toBe(201);
    const pbrTaskId = res.body.data.task._id;

    // Await the event handler (which includes the DB query)
    const { eventPayload, dbDocument } = await capturePromise;

    // event payload ID must match created task
    expect(eventPayload.task._id.toString()).toBe(pbrTaskId.toString());

    // DB document ALREADY existed at the moment the event fired
    expect(dbDocument).not.toBeNull();
    expect(dbDocument._id.toString()).toBe(pbrTaskId.toString());
    expect(dbDocument.title).toBe('PBR: Task Created');

    // Drain TM's task:created event (it also received it)
    await new Promise((r) => setTimeout(r, 100));
    qTmSocket.removeAllListeners('task:created');
  });

  it('comment:new — Comment document exists in DB inside the event handler before handler resolves', async () => {
    // Create a fresh task for a clean comment context
    const taskRes = await request(baseUrl)
      .post(`/api/projects/${qProjectId}/tasks`)
      .set('Authorization', `Bearer ${qPmToken}`)
      .send({ title: 'PBR Comment Task', description: 'comment persistence probe host', priority: 'low' });
    expect(taskRes.status).toBe(201);
    const pbrTaskId = taskRes.body.data.task._id;

    // Drain task:created
    await new Promise((r) => setTimeout(r, 100));
    qPmSocket.removeAllListeners('task:created');
    qTmSocket.removeAllListeners('task:created');

    // Register capture BEFORE REST call — observer is PM socket
    const capturePromise = captureEventWithDbQuery(
      qPmSocket,
      'comment:new',
      async (payload) => {
        // Runs INSIDE the socket.io event callback
        return Comment.findById(payload.comment._id).lean();
      }
    );

    const res = await request(baseUrl)
      .post(`/api/tasks/${pbrTaskId}/comments`)
      .set('Authorization', `Bearer ${qTmToken}`)
      .send({ message: 'PBR: comment persistence test' });
    expect(res.status).toBe(201);
    const pbrCommentId = res.body.data.comment._id;

    const { eventPayload, dbDocument } = await capturePromise;

    // Event payload must carry the correct comment
    expect(eventPayload.comment._id.toString()).toBe(pbrCommentId.toString());

    // Comment ALREADY persisted at the moment the event arrived
    expect(dbDocument).not.toBeNull();
    expect(dbDocument._id.toString()).toBe(pbrCommentId.toString());
    expect(dbDocument.message).toBe('PBR: comment persistence test');

    // Drain TM's comment:new
    await new Promise((r) => setTimeout(r, 100));
    qTmSocket.removeAllListeners('comment:new');
  });

  it('notification:new — Notification document exists in DB inside the TM event handler before handler resolves', async () => {
    // Create a fresh task and assign it to TM to trigger notification:new on TM socket
    const taskRes = await request(baseUrl)
      .post(`/api/projects/${qProjectId}/tasks`)
      .set('Authorization', `Bearer ${qPmToken}`)
      .send({ title: 'PBR Notification Task', description: 'notification persistence probe', priority: 'medium' });
    expect(taskRes.status).toBe(201);
    const pbrTaskId = taskRes.body.data.task._id;

    // Drain task:created events before proceeding
    await new Promise((r) => setTimeout(r, 100));
    qPmSocket.removeAllListeners('task:created');
    qTmSocket.removeAllListeners('task:created');

    // Register capture on TM personal room BEFORE assignment
    const capturePromise = captureEventWithDbQuery(
      qTmSocket,
      'notification:new',
      async (payload) => {
        // Runs INSIDE the socket.io event callback
        // Query by recipient + type + referenceId (the notification referenceId = taskId)
        return Notification.findOne({
          recipient: new mongoose.Types.ObjectId(qTm._id.toString()),
          type: 'task_assigned',
          referenceId: new mongoose.Types.ObjectId(pbrTaskId.toString()),
        }).lean();
      }
    );

    // Trigger assignment (creates notification → emits notification:new)
    const assignRes = await request(baseUrl)
      .patch(`/api/tasks/${pbrTaskId}/assign`)
      .set('Authorization', `Bearer ${qPmToken}`)
      .send({ userId: qTm._id.toString() });
    expect(assignRes.status).toBe(200);

    const { eventPayload, dbDocument } = await capturePromise;

    // Notification event received with correct type
    expect(eventPayload.notification.type).toBe('task_assigned');

    // Notification ALREADY existed in MongoDB at the moment the event fired
    expect(dbDocument).not.toBeNull();
    expect(dbDocument.type).toBe('task_assigned');
    expect(dbDocument.recipient.toString()).toBe(qTm._id.toString());
    expect(dbDocument.referenceId.toString()).toBe(pbrTaskId.toString());

    // Drain task:updated on both sockets (from assignment)
    await new Promise((r) => setTimeout(r, 100));
    qPmSocket.removeAllListeners('task:updated');
    qTmSocket.removeAllListeners('task:updated');
  });
});

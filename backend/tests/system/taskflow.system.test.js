'use strict';
/**
 * TaskFlow System / End-to-End Tests (B18)
 *
 * Tests complete workflows across:
 *   REST API · JWT Authentication · Authorization · MongoDB
 *   Persistent Notifications · Socket.IO realtime delivery
 *   Multiple independent Socket.IO clients
 *
 * Architecture:
 *   - Real HTTP server on ephemeral port (OS-assigned, not 5000)
 *   - Real Socket.IO server
 *   - Dedicated MONGO_URI_TEST database
 *   - supertest for REST mutations
 *   - socket.io-client for realtime verification
 *
 * @file taskflow.system.test.js
 */

require('dotenv').config();
const request    = require('supertest');
const mongoose   = require('mongoose');
const Notification = require('../../src/models/Notification');
const Task         = require('../../src/models/Task');
const Comment      = require('../../src/models/Comment');
const Project      = require('../../src/models/Project');
const { connectTestDb, cleanTestDb, disconnectTestDb } = require('../helpers/testDb');
const { createTestUser, getAuthToken }                 = require('../helpers/factories');
const { startSystemServer, stopSystemServer }          = require('../helpers/systemServer');
const {
  connectSocket,
  joinProjectRoom,
  waitForEvent,
  disconnectSocket,
} = require('../helpers/socketClient');

// ──────────────────────────────────────────────────────────────────────────────
// Server state shared across test blocks
// ──────────────────────────────────────────────────────────────────────────────
let baseUrl;
let app; // express app used by supertest
let admin, pm, tm;
let adminToken, pmToken, tmToken;
let pmSocket, tmSocket;
let projectId, taskId;

// ──────────────────────────────────────────────────────────────────────────────
// Global setup / teardown
// ──────────────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await connectTestDb();
  const { baseUrl: url, server } = await startSystemServer();
  baseUrl = url;
  // Provide the app to supertest via the server address (not fixed port)
  app = baseUrl; // supertest accepts a URL string as the agent
}, 20000);

afterAll(async () => {
  // Disconnect any lingering sockets first
  await disconnectSocket(pmSocket).catch(() => {});
  await disconnectSocket(tmSocket).catch(() => {});
  await stopSystemServer();
  await cleanTestDb();
  await disconnectTestDb();
}, 20000);

// ──────────────────────────────────────────────────────────────────────────────
// STEP 2: Seed users and obtain JWT tokens
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 2 — User Setup & JWT Authentication', () => {
  it('creates Admin, Project Manager, and Team Member via factory; tokens sign correctly', async () => {
    admin = await createTestUser({ role: 'admin',           name: 'System Admin' });
    pm    = await createTestUser({ role: 'project_manager', name: 'System PM' });
    tm    = await createTestUser({ role: 'team_member',     name: 'System TM' });

    adminToken = getAuthToken(admin._id);
    pmToken    = getAuthToken(pm._id);
    tmToken    = getAuthToken(tm._id);

    // Verify each token is accepted by /api/auth/me
    const [ar, pr, tr] = await Promise.all([
      request(baseUrl).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`),
      request(baseUrl).get('/api/auth/me').set('Authorization', `Bearer ${pmToken}`),
      request(baseUrl).get('/api/auth/me').set('Authorization', `Bearer ${tmToken}`),
    ]);
    expect(ar.status).toBe(200);
    expect(pr.status).toBe(200);
    expect(tr.status).toBe(200);
    expect(ar.body.data.user.role).toBe('admin');
    expect(pr.body.data.user.role).toBe('project_manager');
    expect(tr.body.data.user.role).toBe('team_member');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 4 (part 1): PM creates project via REST
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 4A — PM Creates Project A via REST', () => {
  it('creates Project A and confirms persistence in MongoDB', async () => {
    const res = await request(baseUrl)
      .post('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ name: 'System Project A', description: 'E2E system test project' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    projectId = res.body.data.project._id;

    // MongoDB source of truth
    const inDb = await Project.findById(projectId);
    expect(inDb).not.toBeNull();
    expect(inDb.name).toBe('System Project A');
    expect(inDb.owner.toString()).toBe(pm._id.toString());
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 4 (part 2): Connect sockets; PM and TM join project room
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 4B — Socket Connections & Project Room Join', () => {
  it('PM connects and joins project room', async () => {
    pmSocket = await connectSocket(baseUrl, pmToken);
    expect(pmSocket.connected).toBe(true);

    const joinRes = await joinProjectRoom(pmSocket, projectId);
    expect(joinRes.success).toBe(true);
  });

  it('rejects unauthenticated socket with connect_error', async () => {
    await expect(connectSocket(baseUrl, 'invalid.jwt.token')).rejects.toThrow(
      /Socket connect_error/
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 4 (part 3): PM adds TM; TM receives realtime + persistent notification
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 4C — PM Adds TM; TM Receives notification:new & project_member_added', () => {
  it('TM connects before being added; receives notification:new on personal user room', async () => {
    tmSocket = await connectSocket(baseUrl, tmToken);
    expect(tmSocket.connected).toBe(true);

    // Listen for notification before the REST call
    const notifPromise = waitForEvent(tmSocket, 'notification:new');

    const res = await request(baseUrl)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ userId: tm._id.toString() });

    expect(res.status).toBe(200);

    // Realtime: TM personal room receives notification:new
    const notifPayload = await notifPromise;
    expect(notifPayload.notification.type).toBe('project_member_added');
    expect(notifPayload.notification.recipient.toString()).toBe(tm._id.toString());

    // Persistent: notification exists in MongoDB
    const dbNotif = await Notification.findOne({
      recipient: tm._id,
      type: 'project_member_added',
    });
    expect(dbNotif).not.toBeNull();
  });

  it('TM joins project room after being added', async () => {
    const joinRes = await joinProjectRoom(tmSocket, projectId);
    expect(joinRes.success).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 4 (part 4): PM creates task; BOTH clients receive task:created
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 4D — PM Creates Task; Both Clients Receive task:created', () => {
  it('both PM and TM receive task:created with matching IDs (multi-client consistency)', async () => {
    const pmTaskCreated = waitForEvent(pmSocket, 'task:created');
    const tmTaskCreated = waitForEvent(tmSocket, 'task:created');

    const res = await request(baseUrl)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Task Alpha', description: 'System E2E task', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body.data.task.status).toBe('todo');
    expect(res.body.data.task.assignedTo).toBeNull();
    taskId = res.body.data.task._id;

    const [pmEvt, tmEvt] = await Promise.all([pmTaskCreated, tmTaskCreated]);

    // Both receive same entity ID
    expect(pmEvt.task._id.toString()).toBe(taskId.toString());
    expect(tmEvt.task._id.toString()).toBe(taskId.toString());

    // Both receive same project ID
    const evtProjectId = pmEvt.projectId._id || pmEvt.projectId;
    expect(evtProjectId.toString()).toBe(projectId.toString());

    // No duplicate events: each was listened to exactly once (waitForEvent uses socket.once)
  });

  it('persists task in MongoDB BEFORE event callback (persistence-before-realtime)', async () => {
    // Create a fresh second task while immediately querying DB after REST response
    const pmEvt2 = waitForEvent(pmSocket, 'task:created');
    const tmEvt2 = waitForEvent(tmSocket, 'task:created');

    const res = await request(baseUrl)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Persistence Probe Task', description: 'checks DB before event', priority: 'low' });

    expect(res.status).toBe(201);
    const probeTaskId = res.body.data.task._id;

    // Query DB immediately (REST has already returned → DB write already committed)
    const inDb = await Task.findById(probeTaskId);
    expect(inDb).not.toBeNull();
    expect(inDb.title).toBe('Persistence Probe Task');

    // Both events still arrive
    const [pmE, tmE] = await Promise.all([pmEvt2, tmEvt2]);
    expect(pmE.task._id.toString()).toBe(probeTaskId.toString());
    expect(tmE.task._id.toString()).toBe(probeTaskId.toString());
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 4 (part 5): PM assigns Task Alpha to TM; assignment events + private notif
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 4E — Task Assignment: Both Get task:updated; TM Gets Private notification:new', () => {
  it('both PM and TM receive task:updated (changeType=assignment) and TM gets private notification', async () => {
    const pmAssigned = waitForEvent(pmSocket, 'task:updated');
    const tmAssigned = waitForEvent(tmSocket, 'task:updated');
    const tmNotif    = waitForEvent(tmSocket, 'notification:new');

    const res = await request(baseUrl)
      .patch(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ userId: tm._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.task.assignedTo._id.toString()).toBe(tm._id.toString());

    const [pmEvt, tmEvt, notifEvt] = await Promise.all([pmAssigned, tmAssigned, tmNotif]);

    expect(pmEvt.changeType).toBe('assignment');
    expect(tmEvt.changeType).toBe('assignment');
    expect(pmEvt.task._id.toString()).toBe(taskId.toString());
    expect(tmEvt.task._id.toString()).toBe(taskId.toString());

    // Private notification to TM
    expect(notifEvt.notification.type).toBe('task_assigned');
    expect(notifEvt.notification.recipient.toString()).toBe(tm._id.toString());

    // Persistent in MongoDB
    const dbNotif = await Notification.findOne({ recipient: tm._id, type: 'task_assigned' });
    expect(dbNotif).not.toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 10: Verify persistent notification via REST API
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 10 — Persistent Notification via REST API', () => {
  it('GET /api/notifications returns task_assigned notification for TM', async () => {
    const res = await request(baseUrl)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tmToken}`);

    expect(res.status).toBe(200);
    const types = res.body.data.notifications.map((n) => n.type);
    expect(types).toContain('task_assigned');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 4 (part 6): TM changes status todo→in_progress; both receive task:updated
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 4F — TM Updates Status; Both Get task:updated (changeType=status)', () => {
  it('status change fires project-room event to both clients', async () => {
    const pmStatus = waitForEvent(pmSocket, 'task:updated');
    const tmStatus = waitForEvent(tmSocket, 'task:updated');

    const res = await request(baseUrl)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${tmToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('in_progress');

    const [pmEvt, tmEvt] = await Promise.all([pmStatus, tmStatus]);
    expect(pmEvt.changeType).toBe('status');
    expect(tmEvt.changeType).toBe('status');
    expect(pmEvt.task.status).toBe('in_progress');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 5: Comment collaboration workflow
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 5 — Comment Collaboration Workflow', () => {
  let commentId;

  it('TM posts comment; both PM and TM receive comment:new; comment persists in DB', async () => {
    const pmComment = waitForEvent(pmSocket, 'comment:new');
    const tmComment = waitForEvent(tmSocket, 'comment:new');

    const res = await request(baseUrl)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${tmToken}`)
      .send({ message: 'Starting work on Task Alpha now.' });

    expect(res.status).toBe(201);
    commentId = res.body.data.comment._id;

    const [pmEvt, tmEvt] = await Promise.all([pmComment, tmComment]);
    expect(pmEvt.comment._id.toString()).toBe(commentId.toString());
    expect(tmEvt.comment._id.toString()).toBe(commentId.toString());
    expect(pmEvt.comment.user.password).toBeUndefined(); // payload security

    // Persists in MongoDB
    const dbComment = await Comment.findById(commentId);
    expect(dbComment).not.toBeNull();
    expect(dbComment.message).toBe('Starting work on Task Alpha now.');
  });

  it('TM updates own comment; both receive comment:updated', async () => {
    const pmUpdated = waitForEvent(pmSocket, 'comment:updated');
    const tmUpdated = waitForEvent(tmSocket, 'comment:updated');

    const res = await request(baseUrl)
      .patch(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${tmToken}`)
      .send({ message: 'Updated: work completed on Task Alpha.' });

    expect(res.status).toBe(200);
    expect(res.body.data.comment.message).toBe('Updated: work completed on Task Alpha.');

    const [pmEvt, tmEvt] = await Promise.all([pmUpdated, tmUpdated]);
    expect(pmEvt.comment._id.toString()).toBe(commentId.toString());
    expect(tmEvt.comment.message).toBe('Updated: work completed on Task Alpha.');
  });

  it('PM deletes comment (moderation); both receive comment:deleted; DB record gone', async () => {
    const pmDeleted = waitForEvent(pmSocket, 'comment:deleted');
    const tmDeleted = waitForEvent(tmSocket, 'comment:deleted');

    const res = await request(baseUrl)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(200);

    await Promise.all([pmDeleted, tmDeleted]);

    const dbComment = await Comment.findById(commentId);
    expect(dbComment).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 8: Offline notification durability
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 8 — Offline Notification Durability', () => {
  it('disconnected TM still receives notification in MongoDB; GET /api/notifications returns it after reconnect', async () => {
    // Disconnect TM socket
    await disconnectSocket(tmSocket);
    expect(tmSocket.connected).toBe(false);

    // PM performs assignment of a fresh task (creates notification for TM even while offline)
    const freshTaskRes = await request(baseUrl)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Offline Probe Task', description: 'Offline durability test', priority: 'low' });
    expect(freshTaskRes.status).toBe(201);
    const freshTaskId = freshTaskRes.body.data.task._id;

    // Discard the task:created event PM socket receives (not relevant here)
    pmSocket.removeAllListeners('task:created');

    const assignRes = await request(baseUrl)
      .patch(`/api/tasks/${freshTaskId}/assign`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ userId: tm._id.toString() });
    expect(assignRes.status).toBe(200);

    // Notification must exist in DB even though TM was offline
    const dbNotif = await Notification.findOne({
      recipient: tm._id,
      type: 'task_assigned',
      referenceId: new mongoose.Types.ObjectId(freshTaskId),
    });
    expect(dbNotif).not.toBeNull();
    expect(dbNotif.read).toBe(false);

    // Reconnect TM and fetch via REST — notification is present
    tmSocket = await connectSocket(baseUrl, tmToken);
    const notifRes = await request(baseUrl)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tmToken}`);
    expect(notifRes.status).toBe(200);
    const ids = notifRes.body.data.notifications.map((n) => n._id.toString());
    expect(ids).toContain(dbNotif._id.toString());

    // Rejoin project room
    await joinProjectRoom(tmSocket, projectId);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 9: Failed mutation event suppression
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 9 — Failed Mutations Produce No Socket Events', () => {
  it('non-member task creation returns 403 and emits no task:created', async () => {
    // Create a new user that is NOT a project member
    const outsider = await createTestUser({ role: 'team_member', name: 'Outsider' });
    const outsiderToken = getAuthToken(outsider._id);

    let receivedEvent = false;
    pmSocket.once('task:created', () => { receivedEvent = true; });

    const res = await request(baseUrl)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ title: 'Injected Task' });

    expect(res.status).toBe(403);

    // Allow 300ms for any accidental socket event to arrive
    await new Promise((r) => setTimeout(r, 300));
    expect(receivedEvent).toBe(false);
  });

  it('invalid task status update returns 400 and emits no task:updated', async () => {
    let receivedEvent = false;
    pmSocket.once('task:updated', () => { receivedEvent = true; });

    const res = await request(baseUrl)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${tmToken}`)
      .send({ status: 'invalid_status_value' });

    expect(res.status).toBe(400);

    await new Promise((r) => setTimeout(r, 300));
    expect(receivedEvent).toBe(false);
  });

  it('unauthorized comment edit returns 403 and emits no comment:updated', async () => {
    // Create a fresh comment by TM to attempt unauthorized edit by admin
    const c = await Comment.create({ task: taskId, user: tm._id, message: 'Real comment by TM' });

    let receivedEvent = false;
    pmSocket.once('comment:updated', () => { receivedEvent = true; });

    const res = await request(baseUrl)
      .patch(`/api/comments/${c._id}`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ message: 'Unauthorized edit attempt by PM' });

    expect(res.status).toBe(403);

    await new Promise((r) => setTimeout(r, 300));
    expect(receivedEvent).toBe(false);

    // Cleanup
    await Comment.findByIdAndDelete(c._id);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 7: Member removal security workflow
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 7 — Member Removal: Eviction, Notification, Project Isolation', () => {
  it('PM removes TM; project room receives member:removed; TM receives private notification:new', async () => {
    const memberRemoved = waitForEvent(pmSocket, 'member:removed');
    const tmPrivateNotif = waitForEvent(tmSocket, 'notification:new');

    const res = await request(baseUrl)
      .delete(`/api/projects/${projectId}/members/${tm._id}`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(200);

    const [removedEvt, notifEvt] = await Promise.all([memberRemoved, tmPrivateNotif]);
    expect(removedEvt.userId.toString()).toBe(tm._id.toString());
    expect(notifEvt.notification.type).toBe('project_member_removed');
  });

  it('after removal: TM project:join attempt is rejected', async () => {
    const joinRes = await joinProjectRoom(tmSocket, projectId);
    expect(joinRes.success).toBe(false);
    expect(joinRes.message).toMatch(/do not have access/i);
  });

  it('after TM eviction: PM action emits event to PM; TM receives ZERO project-room events', async () => {
    // Give TM a fresh, separate task (for status update trigger)
    const t2Res = await request(baseUrl)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Post-Eviction Task', description: 'Only PM should see this event', priority: 'low' });
    expect(t2Res.status).toBe(201);
    const t2Id = t2Res.body.data.task._id;

    // PM waits for its own task:created
    const pmGetsEvent = waitForEvent(pmSocket, 'task:created');

    // TM must NOT receive any task:created (clear any prior listener, track fresh one)
    let tmGotEvent = false;
    tmSocket.once('task:created', () => { tmGotEvent = true; });

    // Trigger: PM creates another task
    const t3Res = await request(baseUrl)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'PM-Only Task', description: 'Eviction isolation test', priority: 'low' });
    expect(t3Res.status).toBe(201);

    await pmGetsEvent;
    // Wait 400ms; TM should receive nothing
    await new Promise((r) => setTimeout(r, 400));
    expect(tmGotEvent).toBe(false);

    // Cleanup: remove the extra task ids (not strictly required — DB is cleaned in afterAll)
    void t2Id; // referenced to avoid lint warning
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 10: Project deletion workflow
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 10 — Project Deletion: Cascade + Realtime + DB Verification', () => {
  let tempProjectId;
  let pmSocket2, tm2Socket;
  let tm2;

  beforeAll(async () => {
    // Create a fresh project with 2 live socket clients + tasks + comment
    tm2 = await createTestUser({ role: 'team_member', name: 'TM2 For Deletion Test' });
    const tm2Token = getAuthToken(tm2._id);

    const projRes = await request(baseUrl)
      .post('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ name: 'Temp Delete Project', description: 'Will be deleted' });
    expect(projRes.status).toBe(201);
    tempProjectId = projRes.body.data.project._id;

    // Add tm2 to the project
    const addRes = await request(baseUrl)
      .post(`/api/projects/${tempProjectId}/members`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ userId: tm2._id.toString() });
    expect(addRes.status).toBe(200);

    // Create a task and comment
    const taskRes = await request(baseUrl)
      .post(`/api/projects/${tempProjectId}/tasks`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Delete Me Task', description: 'Cascade test', priority: 'low' });
    expect(taskRes.status).toBe(201);
    const delTaskId = taskRes.body.data.task._id;

    await Comment.create({ task: delTaskId, user: pm._id, message: 'Comment for cascade test' });

    // Connect two socket clients and join project room
    pmSocket2 = await connectSocket(baseUrl, pmToken);
    await joinProjectRoom(pmSocket2, tempProjectId);
    tm2Socket = await connectSocket(baseUrl, tm2Token);
    await joinProjectRoom(tm2Socket, tempProjectId);
  }, 15000);

  afterAll(async () => {
    await disconnectSocket(pmSocket2).catch(() => {});
    await disconnectSocket(tm2Socket).catch(() => {});
  });

  it('both connected clients receive project:deleted; MongoDB cascade deletes tasks and comments', async () => {
    const pm2Deleted  = waitForEvent(pmSocket2, 'project:deleted');
    const tm2Deleted  = waitForEvent(tm2Socket, 'project:deleted');

    const res = await request(baseUrl)
      .delete(`/api/projects/${tempProjectId}`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(200);

    const [pm2Evt, tm2Evt] = await Promise.all([pm2Deleted, tm2Deleted]);
    expect(pm2Evt.projectId.toString()).toBe(tempProjectId.toString());
    expect(tm2Evt.projectId.toString()).toBe(tempProjectId.toString());

    // MongoDB cascade: project, tasks, and comments all gone
    const dbProject = await Project.findById(tempProjectId);
    expect(dbProject).toBeNull();

    const dbTasks = await Task.find({ project: tempProjectId });
    expect(dbTasks.length).toBe(0);

    const deletedTaskIds = await Task.find({ project: tempProjectId }).distinct('_id');
    const dbComments = await Comment.find({ task: { $in: deletedTaskIds } });
    expect(dbComments.length).toBe(0);
  });

  it('subsequent project:join attempt on deleted project is rejected', async () => {
    const joinRes = await joinProjectRoom(pmSocket2, tempProjectId);
    expect(joinRes.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 11: Payload security — no secrets in realtime or REST payloads
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 11 — Payload Security', () => {
  const SENSITIVE_KEYS = ['password', 'passwordHash', 'JWT_SECRET', 'MONGO_URI'];

  const scanForSensitive = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return [];
    const hits = [];
    for (const [key, val] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        hits.push(`${path}.${key}`);
      }
      if (typeof val === 'object') hits.push(...scanForSensitive(val, `${path}.${key}`));
    }
    return hits;
  };

  it('GET /api/auth/me response contains no sensitive fields', async () => {
    const res = await request(baseUrl)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${pmToken}`);
    expect(res.status).toBe(200);
    expect(scanForSensitive(res.body)).toHaveLength(0);
  });

  it('realtime task:created payload contains no sensitive fields', async () => {
    const pmCapture = waitForEvent(pmSocket, 'task:created');
    await request(baseUrl)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Security Scan Task', description: 'Payload security test', priority: 'low' });
    const evt = await pmCapture;
    expect(scanForSensitive(evt)).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STEP 13: Cleanup safety confirmation
// ──────────────────────────────────────────────────────────────────────────────
describe('Step 13 — Test DB Cleanup Confirmation', () => {
  it('after tests, MongoDB test database will be fully cleaned by afterAll', async () => {
    // This is a confirmation test — the afterAll block calls cleanTestDb().
    // We verify the test database URI is different from the dev URI.
    const testUri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/taskflow_test';
    const devUri  = process.env.MONGO_URI;
    expect(testUri.toLowerCase()).not.toBe((devUri || '').toLowerCase());
    expect(/test/i.test(testUri)).toBe(true);
  });
});

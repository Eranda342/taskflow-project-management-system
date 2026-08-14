# TaskFlow Security Documentation

This document describes the security measures implemented in the backend. No claim of formal security certification or penetration testing is made.

---

## Authentication

### Password Hashing

User passwords are hashed with **bcryptjs** before storage. Plain-text passwords are never persisted. The `password` Mongoose field has `select: false`, ensuring it is excluded from all query results unless explicitly selected.

### JWT Authentication

Protected routes require:
```
Authorization: Bearer <token>
```

Tokens are signed with `JWT_SECRET` (loaded from environment only). The `authenticate` middleware:
1. Extracts and verifies the Bearer token.
2. Loads the user from MongoDB.
3. Rejects `inactive` accounts with `403 Forbidden`.
4. Attaches the live user to `req.user` for downstream use.

Tokens are stateless; revocation is handled by deactivating the user account (`status: inactive`).

---

## Authorization

### Role-Based Access Control (RBAC)

Route-level: `authorizeRoles(...roles)` middleware checks `req.user.role` against the allowed list. Unauthorized roles receive `403 Forbidden`.

Resource-level: Controllers enforce finer-grained checks:
- Project managers can only modify **their own** projects.
- Task status changes are restricted to **admin**, **project owner**, and the **assignee**.
- Comment edits are restricted to the **comment author** (admin can also delete).
- Notification reads and deletes are restricted to the **recipient**.

### Inactive Account Protection

The `authenticate` middleware checks `user.status === 'inactive'` and returns `403 Forbidden`. This applies to all protected routes regardless of role.

### Server-Controlled Fields

Fields such as `createdBy`, `project`, and `recipient` are always set server-side from authenticated session data (`req.user._id`). They are never accepted from the request body, preventing user-controlled field injection.

---

## Realtime (Socket.IO) Security

### JWT Authentication at WebSocket Layer

The Socket.IO server middleware verifies the JWT from `socket.handshake.auth.token` (or fallback `Authorization` header) on every new connection. Connections without a valid token or belonging to an inactive user are rejected with an `Authentication error` before joining any room.

### Project Room Authorization

The `project:join` event handler performs a database lookup to verify:
1. The project exists.
2. The requesting user has access (`canViewProject` — is admin, owner, or member).

Unauthorized join attempts are rejected with a descriptive error callback.

### Member Eviction

When a user is removed from a project via the REST API, `removeUserFromProjectRoom(userId, projectId)` is called immediately. This uses `io.in(userRoom).socketsLeave(projectRoom)` to evict **all** of the user's active sockets from the project room atomically, regardless of how many browser tabs they have open.

---

## Transport Security

### Helmet

All responses include security headers via **Helmet** (CSP, X-Frame-Options, X-Content-Type-Options, etc.).

### CORS

Requests are restricted to the configured `CLIENT_URL` origin with `credentials: true`. The allowed origin is controlled by server-side environment variable, not client-supplied data.

### JSON Body Limit

The Express JSON parser is capped at **1 MB** to mitigate large-payload denial-of-service attempts.

### Rate Limiting

`POST /api/auth/register` and `POST /api/auth/login` are protected by `express-rate-limit`:
- Window: 15 minutes
- Limit: 300 requests per IP (generous for local dev / CI test suites)
- Returns `429 Too Many Requests` when exceeded

---

## Input Validation

A dedicated `src/utils/validation.js` module provides reusable field validators:
- Email format
- Password length / complexity
- String length limits
- MongoDB ObjectId format

Controllers invoke these validators before any database operation.

---

## Notification Privacy

The Notification model and all notification controllers enforce that:
- Queries always filter by `{ recipient: req.user._id }`.
- No user can list, read, or delete another user's notifications.
- Socket.IO `notification:new` events are emitted **only** to `user:<recipientId>` private rooms.

---

## Repository Secret Management

- **No `.env` or `.env.test` files are tracked** by Git (excluded via `.gitignore`).
- Only `.env.example` and `.env.test.example` (containing placeholder values) are committed.
- The GitHub Actions CI uses dummy test-only values for `JWT_SECRET` and `MONGO_URI_TEST`. No real production credentials are present in the CI configuration.
- `npm audit` reports **0 vulnerabilities** against all 515 backend package dependencies.

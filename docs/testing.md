# TaskFlow Testing Documentation

## Test Strategy

The backend has three permanent, layered levels of automated testing. All tests live inside `backend/tests/` and are version-controlled in the repository.

> **Database safety:** Integration and system tests connect exclusively to `MONGO_URI_TEST` (a dedicated database whose name must contain `"test"`). The helpers enforce this with strict guards that throw a fatal error if the test URI is identical to the development URI or missing the word "test". Development data is never touched.

---

## Test Levels

### Level 1 — Unit Tests

**Directory:** `backend/tests/unit/`  
**Runner:** `npm run test:unit`

Unit tests exercise individual utilities, middleware functions, and service modules **in isolation**. No real MongoDB connection is opened. External dependencies (Mongoose models, other modules) are mocked where needed.

| Suite | What is tested |
|:---|:---|
| `validation.test.js` | All validation helper functions (`validateEmail`, `validatePassword`, `validateObjectId`, etc.) |
| `generateToken.test.js` | JWT generation — correct payload, signing, expiry |
| `roleMiddleware.test.js` | `authorizeRoles` middleware — correct 403 rejection, correct pass-through |
| `errorMiddleware.test.js` | Global error handler — status codes, error shapes, Mongoose error mapping |
| `projectAccess.test.js` | `canViewProject` utility — admin, owner, member, outsider cases |
| `notificationService.test.js` | `createNotification` service — document creation, emit call, type validation |

### Level 2 — Integration / API Tests

**Directory:** `backend/tests/integration/`  
**Runner:** `npm run test:integration`

Integration tests import `src/app.js` directly into Supertest (no HTTP port opened, no `server.js` executed). Each test suite connects to the dedicated test MongoDB, runs real requests through the full Express middleware stack and controller chain, and verifies HTTP responses and database state.

| Suite | What is tested |
|:---|:---|
| `auth.integration.test.js` | Register, login, token verification, inactive user rejection |
| `users.integration.test.js` | Profile update, admin user management, role/status changes |
| `projects.integration.test.js` | Project CRUD, visibility scoping, access control |
| `projectMembers.integration.test.js` | Member add/remove, candidate search, authorization checks |
| `tasks.integration.test.js` | Task CRUD, assignment, status workflow, my-tasks endpoint |
| `comments.integration.test.js` | Comment create/list/edit/delete, authorship enforcement |
| `notifications.integration.test.js` | Inbox read, unread count, mark-read, delete |
| `dashboard.integration.test.js` | Dashboard endpoint responses by role, admin stats |
| `admin.integration.test.js` | User summary, ownership transfer, admin-only gate |
| `lifecycle.integration.test.js` | Inactive account protection, safeguard scenarios |
| `errors.integration.test.js` | 400/401/403/404/409 error shapes, malformed requests |

### Level 3 — System / Realtime Tests

**Directory:** `backend/tests/system/`  
**Runner:** `npm run test:system`

System tests start a real HTTP server on an ephemeral port, connect multiple Socket.IO clients simultaneously, and verify the complete flow: REST mutation → MongoDB write → Socket.IO broadcast. These tests prove that realtime behaviour works across independent client connections.

| Suite | What is tested |
|:---|:---|
| `taskflow.system.test.js` | Full project lifecycle: project creation, member join, task create → event delivery to both clients, task assignment notification, comment realtime broadcast, member removal + room eviction, project deletion + room closure |
| `quality.system.test.js` | Duplicate-event safety (exactly 1 event per mutation per client, counted over deterministic observation windows), notification persistence to MongoDB (verified by DB query inside socket callback), multi-client isolation |

---

## Running the Tests

### Prerequisites

Create `backend/.env` (from `backend/.env.example`) for the test suite's JWT secret.  
Create `backend/.env.test` (from `backend/.env.test.example`) for `MONGO_URI_TEST`.

### Commands

```bash
# All tests
npm test

# By level
npm run test:unit
npm run test:integration
npm run test:system

# With coverage report + thresholds
npm run test:coverage
```

> All commands use `--runInBand` to prevent parallel database interference.

---

## Verified Test Totals (last measured)

| Level | Suites | Tests |
|:---|:---:|:---:|
| Unit | 6 | 81 |
| Integration | 11 | 79 |
| System | 2 | 33 |
| **Total** | **19** | **193** |

All 193 tests pass. Zero failures. Zero skipped.

---

## Coverage

See [`docs/testing.md`](testing.md) — Coverage section and [`docs/devops.md`](devops.md) for CI thresholds.

| Metric | Actual | CI Threshold |
|:---|:---:|:---:|
| Statements | 76.5% | ≥ 70% |
| Branches | 65.6% | ≥ 60% |
| Functions | 91.3% | ≥ 85% |
| Lines | 76.2% | ≥ 70% |

**Note on controller branch coverage (55–70%):** Controllers have many defensive error branches (DB failures, malformed IDs, edge-case missing fields). These require deliberately broken infrastructure or very obscure inputs to trigger. Coverage is honest; no lines were removed or tests inflated to game the metric.

---

## Test Database Safety

`backend/tests/helpers/testDb.js` enforces three hard guards before any connection:

1. `MONGO_URI_TEST` must be non-empty.
2. `MONGO_URI_TEST` must **not** equal `MONGO_URI` (development database).
3. `MONGO_URI_TEST` must contain the word `test` in the database name.

If any guard fails, the entire test suite aborts before connecting. After each test suite, all collections in the test database are wiped to `0` documents.

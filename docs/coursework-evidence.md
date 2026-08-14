# TaskFlow Coursework Evidence Index

This document is an **evidence index** — it maps coursework criteria to specific, verifiable artefacts in the repository. It is not the final coursework report.

---

## Requirements / Analysis

| Evidence | Location |
|:---|:---|
| Functional feature summary | [`README.md`](../README.md) — Core Features section |
| User roles and capabilities | [`README.md`](../README.md) — User Roles table |
| API contract (all endpoints) | [`docs/api.md`](api.md) |
| Authorization requirements | [`docs/authorization-matrix.md`](authorization-matrix.md) |

---

## Design

### Architecture

| Evidence | Location |
|:---|:---|
| System architecture diagram (text) | [`docs/architecture.md`](architecture.md) |
| Component responsibilities | [`docs/architecture.md`](architecture.md) — Component Responsibilities section |
| REST vs Socket.IO responsibility split | [`docs/architecture.md`](architecture.md) — REST vs Socket.IO section |
| Request flow diagram | [`docs/architecture.md`](architecture.md) — Standard Request Flow |
| Realtime room architecture | [`docs/architecture.md`](architecture.md) — Realtime Room Architecture |

### Data Model

| Evidence | Location |
|:---|:---|
| All five Mongoose schemas | [`docs/data-model.md`](data-model.md) |
| Entity relationships | [`docs/data-model.md`](data-model.md) — Relationships section |
| Enum definitions | [`docs/data-model.md`](data-model.md) |
| Schema source files | `backend/src/models/User.js` |
| | `backend/src/models/Project.js` |
| | `backend/src/models/Task.js` |
| | `backend/src/models/Comment.js` |
| | `backend/src/models/Notification.js` |

### API Routes (implementation)

| Feature Area | Route File |
|:---|:---|
| Authentication | `backend/src/routes/authRoutes.js` |
| Users | `backend/src/routes/userRoutes.js` |
| Projects + Members | `backend/src/routes/projectRoutes.js` |
| Tasks | `backend/src/routes/taskRoutes.js` |
| Comments | `backend/src/routes/commentRoutes.js` |
| Notifications | `backend/src/routes/notificationRoutes.js` |
| Dashboard + Stats | `backend/src/routes/dashboardRoutes.js` |
| Admin Operations | `backend/src/routes/adminRoutes.js` |

### Authorization Implementation

| Evidence | Location |
|:---|:---|
| JWT middleware | `backend/src/middleware/authMiddleware.js` |
| Role middleware | `backend/src/middleware/roleMiddleware.js` |
| Project access utility | `backend/src/utils/projectAccess.js` |
| Resource-level checks in controllers | `backend/src/controllers/projectController.js` |
| | `backend/src/controllers/taskController.js` |
| | `backend/src/controllers/commentController.js` |
| | `backend/src/controllers/notificationController.js` |
| Authorization matrix | [`docs/authorization-matrix.md`](authorization-matrix.md) |

---

## Testing

### Test Strategy and Documentation

| Evidence | Location |
|:---|:---|
| Testing strategy overview | [`docs/testing.md`](testing.md) |
| Three-level testing rationale | [`docs/testing.md`](testing.md) — Test Levels section |
| Test database safety design | [`docs/testing.md`](testing.md) — Test Database Safety |
| Test database helpers | `backend/tests/helpers/testDb.js` |
| Test factories | `backend/tests/helpers/factories.js` |
| Socket client helper | `backend/tests/helpers/socketClient.js` |

### Unit Tests

| Suite | File |
|:---|:---|
| Validation utilities | `backend/tests/unit/validation.test.js` |
| JWT generation | `backend/tests/unit/generateToken.test.js` |
| Role middleware | `backend/tests/unit/roleMiddleware.test.js` |
| Error middleware | `backend/tests/unit/errorMiddleware.test.js` |
| Project access helper | `backend/tests/unit/projectAccess.test.js` |
| Notification service | `backend/tests/unit/notificationService.test.js` |

### Integration Tests

| Suite | File |
|:---|:---|
| Authentication API | `backend/tests/integration/auth.integration.test.js` |
| Users API | `backend/tests/integration/users.integration.test.js` |
| Projects API | `backend/tests/integration/projects.integration.test.js` |
| Project Members API | `backend/tests/integration/projectMembers.integration.test.js` |
| Tasks API | `backend/tests/integration/tasks.integration.test.js` |
| Comments API | `backend/tests/integration/comments.integration.test.js` |
| Notifications API | `backend/tests/integration/notifications.integration.test.js` |
| Dashboard API | `backend/tests/integration/dashboard.integration.test.js` |
| Admin API | `backend/tests/integration/admin.integration.test.js` |
| User lifecycle | `backend/tests/integration/lifecycle.integration.test.js` |
| Error handling | `backend/tests/integration/errors.integration.test.js` |

### System / Realtime Tests

| Suite | File | Key Scenarios |
|:---|:---|:---|
| End-to-end workflow | `backend/tests/system/taskflow.system.test.js` | Full project lifecycle, task events to both clients, notification on assignment, member eviction from Socket.IO room, project deletion room closure |
| Quality assurance | `backend/tests/system/quality.system.test.js` | Exactly 1 event per mutation (duplicate suppression), notification persistence verified by DB query inside socket callback, multi-client isolation |

---

## DevOps / CI

| Evidence | Location |
|:---|:---|
| CI pipeline definition | `.github/workflows/backend-ci.yml` |
| CI documentation | [`docs/devops.md`](devops.md) |
| ESLint configuration | `backend/eslint.config.js` |
| Jest + coverage configuration | `backend/jest.config.js` |
| npm scripts | `backend/package.json` — scripts section |

**Pipeline stages evidenced:**
1. `npm ci` — reproducible clean install
2. `npm run lint` — static analysis with `--max-warnings=0`
3. `npm run test:unit` — isolated unit verification
4. `npm run test:integration` — API + DB integration verification
5. `npm run test:system` — realtime multi-client system verification
6. `npm run test:coverage` — coverage measurement + quality gate
7. Coverage artifact upload (HTML + LCOV)

---

## Security

| Evidence | Location |
|:---|:---|
| Security measures overview | [`docs/security.md`](security.md) |
| bcrypt hashing | `backend/src/controllers/authController.js` |
| JWT authentication middleware | `backend/src/middleware/authMiddleware.js` |
| Role-based authorization | `backend/src/middleware/roleMiddleware.js` |
| Project resource authorization | `backend/src/utils/projectAccess.js` |
| Notification inbox isolation | `backend/src/controllers/notificationController.js` |
| Server-controlled field protection | `backend/src/controllers/taskController.js` (e.g. `createdBy` set from `req.user._id`) |
| Admin lifecycle safeguards | `backend/src/controllers/userController.js`, `backend/src/controllers/adminController.js` |
| Socket.IO JWT auth | `backend/src/socket/socketManager.js` — `socketAuthMiddleware` |
| Project room access check | `backend/src/socket/socketManager.js` — `project:join` handler |
| Member room eviction | `backend/src/socket/socketManager.js` — `removeUserFromProjectRoom` |
| Helmet security headers | `backend/src/app.js` |
| Auth rate limiting | `backend/src/middleware/rateLimitMiddleware.js` |

---

## Evaluation

### Actual Coverage (last measured)

| Metric | Value |
|:---|:---:|
| Statements | 76.5% |
| Branches | 65.6% |
| Functions | 91.3% |
| Lines | 76.2% |

### Verified Test Count

| Total Suites | Total Tests | Pass | Fail |
|:---:|:---:|:---:|:---:|
| 19 | 193 | 193 | 0 |

### Static Analysis

ESLint: 0 errors, 0 warnings across `src/` and `tests/` with `--max-warnings=0`.

### Security Audit

`npm audit`: 0 vulnerabilities across 515 backend packages.

---

## Software Functionality

| Feature | Evidence |
|:---|:---|
| Authentication (register/login/JWT) | `auth.integration.test.js` |
| RBAC (role enforcement) | `roleMiddleware.test.js`, `users.integration.test.js`, `projects.integration.test.js` |
| Project management | `projects.integration.test.js` |
| Member management | `projectMembers.integration.test.js` |
| Task management + workflow | `tasks.integration.test.js` |
| Comments | `comments.integration.test.js` |
| Persistent notifications | `notifications.integration.test.js` |
| Realtime Socket.IO (multi-client) | `taskflow.system.test.js` |
| Duplicate-event prevention | `quality.system.test.js` |
| Offline notification persistence | `quality.system.test.js` — DB query inside socket callback |
| Member eviction from Socket.IO room | `taskflow.system.test.js` |
| Dashboard by role | `dashboard.integration.test.js` |
| Admin operations | `admin.integration.test.js` |
| Inactive account protection | `lifecycle.integration.test.js` |
| Error handling shapes | `errors.integration.test.js` |

# TaskFlow System Architecture

## Overview

TaskFlow is a layered REST + WebSocket application. MongoDB is the single source of truth. Socket.IO distributes realtime events only **after** mutations have been successfully committed to the database.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────┐
│          React Frontend (in development)      │
│  REST calls via Axios  │  Socket.IO Client    │
└────────────┬───────────┴──────────┬───────────┘
             │ HTTP REST            │ WebSocket
             ▼                      ▼
┌──────────────────────────────────────────────┐
│          Node.js / Express (src/app.js)       │
│                                              │
│  Helmet │ CORS │ Rate Limit │ JSON body       │
│                                              │
│  ┌──────────────┐   ┌────────────────────┐   │
│  │   REST Routes│   │  Socket.IO Server  │   │
│  └──────┬───────┘   └────────┬───────────┘   │
│         │                    │               │
│  ┌──────▼──────────────────────────────────┐ │
│  │          Middleware Layer                │ │
│  │  authenticate │ authorizeRoles           │ │
│  │  notFoundHandler │ errorHandler          │ │
│  └──────┬───────────────────────────────────┘ │
│         │                                     │
│  ┌──────▼───────────────────┐                 │
│  │      Controllers          │                 │
│  │  authController           │                 │
│  │  userController           │                 │
│  │  projectController        │                 │
│  │  taskController           │                 │
│  │  commentController        │                 │
│  │  notificationController   │                 │
│  │  dashboardController      │                 │
│  │  adminController          │                 │
│  └──────┬───────────────────┘                 │
│         │                                     │
│  ┌──────▼───────────────────┐                 │
│  │      Services / Utils     │                 │
│  │  notificationService      │                 │
│  │  projectAccess helper     │                 │
│  │  validation utilities     │                 │
│  └──────┬───────────────────┘                 │
│         │                                     │
│  ┌──────▼───────────────────┐                 │
│  │      Mongoose ODM         │                 │
│  │  User, Project, Task      │                 │
│  │  Comment, Notification    │                 │
│  └──────┬───────────────────┘                 │
└─────────┼─────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│     MongoDB          │
│  (source of truth)   │
└─────────────────────┘
```

---

## Component Responsibilities

### `src/app.js`
Express application factory. Registers all global middleware (Helmet, CORS, JSON body parser, rate limiter) and mounts all route modules under `/api`. Does not open an HTTP port — that is `server.js`.

### `src/server.js`
Entrypoint. Connects to MongoDB, creates the HTTP server, attaches Socket.IO, then starts listening. Not imported by tests (tests use `app.js` directly or start their own ephemeral server).

### `src/config/database.js`
Mongoose connection logic. Reads `MONGO_URI` from environment.

### `src/routes/`
Pure Express Router definitions. Each file defines paths, attaches middleware (authenticate, authorizeRoles), and delegates to a controller function. Routes contain no business logic.

### `src/middleware/`
| File | Responsibility |
|:---|:---|
| `authMiddleware.js` | Verifies JWT Bearer token; loads the active user into `req.user` |
| `roleMiddleware.js` | Checks `req.user.role` against an allowed roles list |
| `errorMiddleware.js` | Global 404 handler and centralized error formatter |
| `rateLimitMiddleware.js` | `express-rate-limit` applied to login and register endpoints |

### `src/controllers/`
Request/response boundary. Each controller function: validates input, performs resource-level authorization checks (e.g. "is this PM the project owner?"), delegates persistence work to Mongoose models, triggers notification creation and Socket.IO broadcasts, then returns the HTTP response.

### `src/services/notificationService.js`
Reusable service for creating `Notification` documents and emitting `notification:new` to the recipient's private Socket.IO room. Called from controllers; keeps notification logic DRY across task assignment, member add/remove, status updates, etc.

### `src/socket/socketManager.js`
Initializes the Socket.IO `Server`. Implements:
- JWT authentication middleware for all socket connections
- Auto-join to `user:<userId>` personal room on connect
- `project:join` event handler with project membership verification
- `project:leave` event handler
- `emitToProject`, `emitToUser`, `removeUserFromProjectRoom`, `addUserToProjectRoom`, `closeProjectRoom` utilities used by controllers

### `src/models/`
Mongoose schemas for all five collections: `User`, `Project`, `Task`, `Comment`, `Notification`. All include compound indexes for performance.

### `src/utils/`
| File | Responsibility |
|:---|:---|
| `asyncHandler.js` | Express async error wrapper (used in legacy patterns) |
| `generateToken.js` | Signs a JWT for a given userId |
| `notificationConstants.js` | Frozen enum of notification types |
| `projectAccess.js` | `canViewProject(project, user)` access helper |
| `projectStatus.js` | Frozen enum of project status values |
| `roles.js` | Frozen `ROLES` enum (`admin`, `project_manager`, `team_member`) |
| `taskConstants.js` | Frozen enums for task status and priority |
| `validation.js` | Reusable field validators (email, password, ObjectId, etc.) |

---

## Standard Backend Request Flow

```
HTTP Request
    │
    ▼
Express Router (route match)
    │
    ▼
authenticate middleware (JWT → req.user)
    │
    ▼
authorizeRoles middleware (role check, if applicable)
    │
    ▼
Controller function
    │
    ├── Input validation (validation utils)
    │
    ├── Resource-level authorization (ownership / membership checks)
    │
    ├── Mongoose read / write → MongoDB
    │
    ├── [optional] notificationService.createNotification()
    │       └── Saves Notification document → MongoDB
    │           └── emitToUser() → Socket.IO user room
    │
    └── [optional] emitToProject() → Socket.IO project room
    │
    ▼
HTTP Response  { success, message, data }
```

---

## REST vs. Socket.IO Responsibilities

| Concern | Mechanism |
|:---|:---|
| State mutations (create, update, delete) | REST API |
| Authentication for API | JWT Bearer in `Authorization` header |
| Authentication for WebSocket | JWT in `socket.handshake.auth.token` |
| Source of truth | MongoDB |
| Realtime event delivery | Socket.IO (after MongoDB write) |
| Persistent notification storage | MongoDB `Notification` collection |
| Offline notification delivery | REST `GET /api/notifications` on reconnect |

Socket.IO is a delivery mechanism only. Clients must never rely on Socket.IO events as their source of truth for data. All state changes go through REST.

---

## Realtime Room Architecture

```
io (Socket.IO namespace: "/")
├── user:<userId>         ← personal private room (auto-joined on connect)
│   └── Events: notification:new
│
└── project:<projectId>   ← shared project room (joined via project:join)
    └── Events: task:created, task:updated, task:deleted,
                comment:new, comment:updated, comment:deleted,
                project:updated, project:deleted,
                member:added, member:removed
```

On **member removal**, the server calls `removeUserFromProjectRoom(userId, projectId)` which uses `io.in(userRoom).socketsLeave(projectRoom)` to evict all of the removed user's sockets atomically.

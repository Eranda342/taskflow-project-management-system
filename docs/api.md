# TaskFlow REST API Reference

Base URL: `http://localhost:5000/api`

All protected endpoints require:
```
Authorization: Bearer <JWT>
```

Standard response envelope:
```json
{ "success": true|false, "message": "...", "data": { ... } }
```

---

## Authentication

| Method | Path | Auth | Roles | Description |
|:---|:---|:---|:---|:---|
| `POST` | `/auth/register` | Public | — | Register a new account (always creates `team_member`) |
| `POST` | `/auth/login` | Public | — | Login and receive JWT |
| `GET` | `/auth/me` | Required | Any | Get the authenticated user's own profile |

> `POST /auth/register` and `POST /auth/login` are rate-limited: 300 requests per 15 minutes per IP.

### Register

```
POST /api/auth/register
Content-Type: application/json

{ "name": "Alice", "email": "alice@example.com", "password": "Secure1234!" }

201 Created
{ "success": true, "message": "User registered successfully", "data": { "token": "<JWT>", "user": { ... } } }
```

### Login

```
POST /api/auth/login
Content-Type: application/json

{ "email": "alice@example.com", "password": "Secure1234!" }

200 OK
{ "success": true, "data": { "token": "<JWT>", "user": { ... } } }
```

---

## Users

> All `/api/users` routes (except `/users/me/profile`) require `admin` role.

| Method | Path | Auth | Roles | Description |
|:---|:---|:---|:---|:---|
| `PATCH` | `/users/me/profile` | Required | Any | Update own name and/or profile image |
| `GET` | `/users` | Required | Admin | List all users |
| `GET` | `/users/:userId` | Required | Admin | Get a specific user by ID |
| `PATCH` | `/users/:userId/role` | Required | Admin | Change a user's role |
| `PATCH` | `/users/:userId/status` | Required | Admin | Activate or deactivate a user account |

---

## Projects

| Method | Path | Auth | Roles | Description |
|:---|:---|:---|:---|:---|
| `POST` | `/projects` | Required | Admin, Project Manager | Create a new project |
| `GET` | `/projects` | Required | Any | List projects (admin sees all; others see own/member projects) |
| `GET` | `/projects/:projectId` | Required | Admin, Owner, Member | Get project details |
| `PATCH` | `/projects/:projectId` | Required | Admin, Project Manager | Update project name/description/status/dates (controller enforces ownership for PM) |
| `DELETE` | `/projects/:projectId` | Required | Admin, Owner | Delete project (must transfer ownership of tasks first or be admin) |

---

## Project Members

| Method | Path | Auth | Roles | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/projects/:projectId/members` | Required | Admin, Owner, Member | List project members |
| `POST` | `/projects/:projectId/members` | Required | Admin, Project Manager | Add a member (controller checks ownership for PM) |
| `DELETE` | `/projects/:projectId/members/:userId` | Required | Admin, Project Manager | Remove a member; evicts them from the Socket.IO project room |
| `GET` | `/projects/:projectId/member-candidates` | Required | Admin, Project Manager | Search users eligible for project membership |

---

## Tasks

| Method | Path | Auth | Roles | Description |
|:---|:---|:---|:---|:---|
| `POST` | `/projects/:projectId/tasks` | Required | Admin, Project Manager | Create a task in a project |
| `GET` | `/projects/:projectId/tasks` | Required | Admin, Owner, Member | List all tasks for a project |
| `GET` | `/tasks/my` | Required | Any | List tasks assigned to the authenticated user |
| `GET` | `/tasks/:taskId` | Required | Admin, Project Member | Get a single task |
| `PATCH` | `/tasks/:taskId` | Required | Admin, Project Manager | Update task details (controller checks ownership for PM) |
| `PATCH` | `/tasks/:taskId/assign` | Required | Admin, Project Manager | Assign task to a project member (sends notification + Socket.IO event) |
| `PATCH` | `/tasks/:taskId/status` | Required | Any (auth) | Update task status (controller enforces: admin / project owner / assignee only) |
| `DELETE` | `/tasks/:taskId` | Required | Admin, Project Manager | Delete a task |

### Task Status Values

`todo` → `in_progress` → `review` → `completed`

### Task Priority Values

`low` | `medium` | `high` | `urgent`

---

## Comments

| Method | Path | Auth | Roles | Description |
|:---|:---|:---|:---|:---|
| `POST` | `/tasks/:taskId/comments` | Required | Project Member | Post a comment on a task |
| `GET` | `/tasks/:taskId/comments` | Required | Project Member | List all comments for a task |
| `PATCH` | `/comments/:commentId` | Required | Comment Author | Edit own comment |
| `DELETE` | `/comments/:commentId` | Required | Comment Author, Admin | Delete a comment |

---

## Notifications

> All notification routes operate on the **authenticated user's own inbox only**. Users cannot read or modify another user's notifications.

| Method | Path | Auth | Roles | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/notifications` | Required | Any | List own notifications (newest first, paginated) |
| `GET` | `/notifications/unread-count` | Required | Any | Get count of unread notifications |
| `PATCH` | `/notifications/:notificationId/read` | Required | Recipient | Mark a single notification as read |
| `PATCH` | `/notifications/read-all` | Required | Any | Mark all own notifications as read |
| `DELETE` | `/notifications/:notificationId` | Required | Recipient | Delete a notification |

### Notification Types

| Type | Trigger |
|:---|:---|
| `task_assigned` | Task is assigned to user |
| `task_status_updated` | Task status changes |
| `comment_added` | Comment added to an assigned task |
| `project_member_added` | User is added to a project |
| `project_member_removed` | User is removed from a project |
| `project_ownership_transferred` | Project ownership is transferred to user |

---

## Dashboard

| Method | Path | Auth | Roles | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/dashboard` | Required | Any | Role-scoped dashboard summary (content varies by role) |
| `GET` | `/admin/stats` | Required | Admin | Platform-wide analytics (user counts, project stats, task stats) |

---

## Admin Operations

| Method | Path | Auth | Roles | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/admin/users/:userId/summary` | Required | Admin | Get user's operational summary (projects owned, tasks, etc.) before lifecycle actions |
| `PATCH` | `/admin/projects/:projectId/owner` | Required | Admin | Transfer project ownership to another user |

---

## Health Check

| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/api/health` | Public | Server liveness check |

```
GET /api/health
200 OK  { "success": true, "message": "TaskFlow API is running" }
```

---

## Error Responses

| Status | Meaning |
|:---|:---|
| `400` | Validation error or bad request |
| `401` | Missing or invalid JWT |
| `403` | Authenticated but insufficient permissions, or account inactive |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email, member already in project) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

Error envelope:
```json
{ "success": false, "message": "Human-readable error description" }
```

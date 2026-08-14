# TaskFlow Data Models

All models use Mongoose with MongoDB. Each document includes auto-generated `_id`, `createdAt`, and `updatedAt` timestamps unless noted otherwise.

---

## User

**Collection:** `users`  
**File:** `src/models/User.js`

| Field | Type | Required | Notes |
|:---|:---|:---:|:---|
| `name` | String | ✅ | Max 100 chars |
| `email` | String | ✅ | Unique, lowercase, indexed |
| `password` | String | ✅ | Min 8 chars; `select: false` (never returned in queries) |
| `role` | String (enum) | — | Default: `team_member` |
| `status` | String (enum) | — | Default: `active` |
| `profileImage` | String | — | URL; default `null` |
| `createdAt` | Date | — | Auto |
| `updatedAt` | Date | — | Auto |

**Role enum:** `admin` | `project_manager` | `team_member`  
**Status enum:** `active` | `inactive`

Public registration always produces `role: team_member`. Admins can later change roles via `PATCH /api/users/:userId/role`.

---

## Project

**Collection:** `projects`  
**File:** `src/models/Project.js`

| Field | Type | Required | Notes |
|:---|:---|:---:|:---|
| `name` | String | ✅ | Max 150 chars |
| `description` | String | ✅ | Max 2000 chars |
| `owner` | ObjectId → User | ✅ | Project creator (indexed) |
| `members` | [ObjectId → User] | — | Array of user refs (indexed) |
| `startDate` | Date | — | Default `null` |
| `deadline` | Date | — | Default `null` |
| `status` | String (enum) | — | Default: `planning` |
| `createdAt` | Date | — | Auto |
| `updatedAt` | Date | — | Auto |

**Status enum:** `planning` | `active` | `on_hold` | `completed` | `cancelled`

**Indexes:** `owner`, `members`, `status`, `createdAt` (descending)

---

## Task

**Collection:** `tasks`  
**File:** `src/models/Task.js`

| Field | Type | Required | Notes |
|:---|:---|:---:|:---|
| `title` | String | ✅ | Max 200 chars |
| `description` | String | — | Max 3000 chars; default `""` |
| `project` | ObjectId → Project | ✅ | Parent project reference |
| `assignedTo` | ObjectId → User | — | Default `null` |
| `createdBy` | ObjectId → User | ✅ | Creator reference |
| `priority` | String (enum) | — | Default: `medium` |
| `status` | String (enum) | — | Default: `todo` |
| `dueDate` | Date | — | Default `null` |
| `createdAt` | Date | — | Auto |
| `updatedAt` | Date | — | Auto |

**Status enum:** `todo` | `in_progress` | `review` | `completed`  
**Priority enum:** `low` | `medium` | `high` | `urgent`

**Indexes:** `(project, status)`, `assignedTo`, `createdBy`, `dueDate`, `createdAt` (descending)

---

## Comment

**Collection:** `comments`  
**File:** `src/models/Comment.js`

| Field | Type | Required | Notes |
|:---|:---|:---:|:---|
| `task` | ObjectId → Task | ✅ | Parent task reference |
| `user` | ObjectId → User | ✅ | Comment author |
| `message` | String | ✅ | Max 2000 chars |
| `createdAt` | Date | — | Auto |
| `updatedAt` | Date | — | Auto |

**Index:** `(task, createdAt)` — chronological retrieval per task

---

## Notification

**Collection:** `notifications`  
**File:** `src/models/Notification.js`

| Field | Type | Required | Notes |
|:---|:---|:---:|:---|
| `recipient` | ObjectId → User | ✅ | Notification owner (inbox) |
| `sender` | ObjectId → User | — | Who triggered it; `null` for system events |
| `type` | String (enum) | ✅ | Notification category |
| `message` | String | ✅ | Human-readable text; max 500 chars |
| `referenceId` | ObjectId | — | Related document ID (task, project, etc.) |
| `read` | Boolean | — | Default: `false` |
| `createdAt` | Date | — | Auto |
| `updatedAt` | Date | — | Auto |

**Type enum:**  
`task_assigned` | `task_status_updated` | `comment_added` | `project_member_added` | `project_member_removed` | `project_ownership_transferred`

**Indexes:** `(recipient, createdAt desc)`, `(recipient, read)`

---

## Relationships

```
User ─────────── owns ──────────────────── Project
User ─────────── is member of ─────────── Project
Project ─────── contains ──────────────── Task (many)
Task ─────────── assigned to ──────────── User (optional)
Task ─────────── created by ────────────── User
Task ─────────── has comments ─────────── Comment (many)
Comment ────── authored by ─────────────── User
User ─────────── has notifications ──────── Notification (many)
Notification ── references ─────────────── Task or Project (via referenceId)
```

---

## Important Constraints

- A user's `password` field has `select: false` — it is never included in Mongoose query results unless explicitly selected.
- `Notification` documents are **private** — the API enforces that only the `recipient` can read or delete their own notifications.
- Removing a user from a project does **not** delete their tasks or comments, but does evict them from the Socket.IO project room.
- Admin can view all projects; non-admin users can only view projects they own or are members of.

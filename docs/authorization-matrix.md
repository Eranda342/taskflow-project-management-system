# TaskFlow Authorization Matrix

This matrix documents who can perform which operations on TaskFlow resources.

**Roles:**
- **Admin** — platform administrator
- **Owner** — project_manager who created (owns) the specific project
- **PM (non-owner)** — project_manager who is not the project owner
- **Member** — any user (including admin/PM) who is a project member
- **Outsider** — authenticated user with no relation to the project

---

## Authentication

| Operation | Admin | Project Manager | Team Member | Unauthenticated |
|:---|:---:|:---:|:---:|:---:|
| Register | ✅ | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ | ✅ |
| Get own profile | ✅ | ✅ | ✅ | ❌ |
| Update own profile | ✅ | ✅ | ✅ | ❌ |

---

## User Management (Admin-only)

| Operation | Admin | Project Manager | Team Member |
|:---|:---:|:---:|:---:|
| List all users | ✅ | ❌ | ❌ |
| Get any user by ID | ✅ | ❌ | ❌ |
| Change a user's role | ✅ | ❌ | ❌ |
| Activate / deactivate a user | ✅ | ❌ | ❌ |

---

## Projects

| Operation | Admin | Owner | PM (non-owner) | Member | Outsider |
|:---|:---:|:---:|:---:|:---:|:---:|
| Create project | ✅ | n/a | ✅ | ❌ | ❌ |
| List projects | ✅ (all) | ✅ (own) | ✅ (own) | ✅ (where member) | ✅ (none visible) |
| View project details | ✅ | ✅ | ✅ if member | ✅ | ❌ |
| Update project | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete project | ✅ | ✅ | ❌ | ❌ | ❌ |

> **Note:** Route-level authorization allows `admin` or `project_manager` to hit update/delete endpoints. The controller then enforces that PMs can only mutate their own projects.

---

## Project Members

| Operation | Admin | Owner | PM (non-owner) | Member | Outsider |
|:---|:---:|:---:|:---:|:---:|:---:|
| List members | ✅ | ✅ | ✅ if member | ✅ | ❌ |
| Add member | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove member | ✅ | ✅ | ❌ | ❌ | ❌ |
| Search member candidates | ✅ | ✅ | ❌ | ❌ | ❌ |

> Member removal evicts the user from the Socket.IO project room immediately.

---

## Tasks

| Operation | Admin | Owner | PM (non-owner) | Member | Outsider |
|:---|:---:|:---:|:---:|:---:|:---:|
| Create task | ✅ | ✅ | ❌ | ❌ | ❌ |
| List project tasks | ✅ | ✅ | ✅ if member | ✅ | ❌ |
| View task details | ✅ | ✅ | ✅ if member | ✅ | ❌ |
| Update task metadata | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign task | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update task status | ✅ | ✅ | Assignee only | Assignee only | ❌ |
| Delete task | ✅ | ✅ | ❌ | ❌ | ❌ |
| View own assigned tasks | ✅ | ✅ | ✅ | ✅ | — |

> **Task status:** All authenticated users can reach the route, but the controller enforces that only the admin, project owner, or the assigned user may change status.

---

## Comments

| Operation | Admin | Author | Other Member | Non-member |
|:---|:---:|:---:|:---:|:---:|
| Post comment (on accessible task) | ✅ | ✅ | ✅ | ❌ |
| List task comments | ✅ | ✅ | ✅ | ❌ |
| Edit own comment | ✅ | ✅ | ❌ | ❌ |
| Delete comment | ✅ | ✅ | ❌ | ❌ |

---

## Notifications

All notification operations are **strictly scoped to the authenticated user's own inbox**. No user can view or modify another user's notifications.

| Operation | Recipient | Any Other User |
|:---|:---:|:---:|
| List own notifications | ✅ | ❌ |
| Get unread count | ✅ | ❌ |
| Mark notification read | ✅ | ❌ |
| Mark all notifications read | ✅ | ❌ |
| Delete notification | ✅ | ❌ |

---

## Dashboard & Analytics

| Operation | Admin | Project Manager | Team Member |
|:---|:---:|:---:|:---:|
| Role-scoped dashboard | ✅ | ✅ | ✅ |
| Admin platform analytics (`/admin/stats`) | ✅ | ❌ | ❌ |

---

## Admin-Exclusive Operations

| Operation | Admin | Anyone Else |
|:---|:---:|:---:|
| List all users | ✅ | ❌ |
| View user operational summary | ✅ | ❌ |
| Change user role | ✅ | ❌ |
| Activate / deactivate user | ✅ | ❌ |
| Transfer project ownership | ✅ | ❌ |
| Platform analytics (`/admin/stats`) | ✅ | ❌ |

---

## Inactive Account Behaviour

Any user with `status: inactive` will receive `403 Forbidden` on all protected routes regardless of their role. The `authenticate` middleware enforces this unconditionally.

---

## Socket.IO Authorization

| Operation | Condition |
|:---|:---|
| Establish WebSocket connection | Valid JWT in handshake; user must be `active` |
| Auto-join personal room (`user:<userId>`) | On connection (automatic) |
| Join project room (`project:join` event) | User must be project member or admin |
| Receive project events | Must be joined to the project room |
| Receive private notifications | Always delivered to `user:<userId>` room |
| Eviction from project room | On member removal — server calls `socketsLeave` |

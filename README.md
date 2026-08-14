# TaskFlow

**TaskFlow** is a real-time, full-stack Project Management System that enables teams to organise projects, manage tasks, collaborate through comments, and receive live notifications — all within a role-based access control framework.

---

## Development Status

| Layer | Status |
|:---|:---|
| **Backend REST API** | ✅ Complete (B1–B19) |
| **Backend Unit / Integration / System Tests** | ✅ Complete — 193 tests, 19 suites |
| **Backend CI / Quality Gates** | ✅ Live via GitHub Actions |
| **Frontend (React)** | 🚧 In development |

---

## User Roles

| Role | Capabilities |
|:---|:---|
| **Admin** | Full platform access; user lifecycle, analytics, ownership transfer |
| **Project Manager** | Create and manage own projects, assign tasks, manage members |
| **Team Member** | View accessible projects, update assigned task status, comment |

Public registration always creates a `team_member` account. Role changes are admin-only.

---

## Core Features (Backend)

- **Authentication** — JWT-based register/login with rate limiting
- **Role-Based Authorization** — fine-grained RBAC across all API routes
- **Project Management** — create, update, delete, lifecycle status management
- **Project Member Management** — add/remove members, room eviction on removal
- **Task Management** — create, update, delete tasks within projects
- **Task Assignment & Status Workflow** — controlled assignment and status transitions
- **Comments** — per-task comments with author-only edit/delete
- **Persistent Notifications** — durable inbox with unread count and mark-as-read
- **Realtime Socket.IO** — live events after all writes are committed to MongoDB
- **Role-Scoped Dashboards** — personalised overview by role
- **Admin Operations** — user management, analytics, project ownership transfer
- **User Lifecycle Safeguards** — inactive account protection, ownership transfer before deletion

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|:---|:---|:---|
| Node.js | 24.x | Runtime |
| Express | ^5.2.1 | Web framework |
| MongoDB | 7.0 | Primary database |
| Mongoose | ^9.9.1 | ODM / schema validation |
| Socket.IO | ^4.8.3 | Realtime WebSocket layer |
| jsonwebtoken | ^9.0.3 | JWT authentication |
| bcryptjs | ^3.0.3 | Password hashing |
| Helmet | ^8.3.0 | HTTP security headers |
| express-rate-limit | ^8.6.2 | Auth brute-force protection |
| dotenv | ^17.4.2 | Environment variable loading |
| cors | ^2.8.6 | Cross-origin resource sharing |

### Testing & Quality

| Tool | Version | Purpose |
|:---|:---|:---|
| Jest | ^30.4.2 | Test runner |
| Supertest | ^7.2.2 | HTTP integration testing |
| socket.io-client | ^4.8.3 | Realtime system testing |
| ESLint | ^10.8.1 | Static analysis |
| GitHub Actions | — | CI quality pipeline |

### Frontend (in development)

- React (Vite)
- Axios
- React Router
- Socket.IO Client

---

## Project Structure

```
taskflow-project-management-system/
├── backend/             # Node.js/Express API (complete)
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/      # Database connection
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth, RBAC, error handling, rate limiting
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/      # Express route definitions
│   │   ├── services/    # Reusable business logic (notifications)
│   │   ├── socket/      # Socket.IO server and room management
│   │   └── utils/       # Constants, helpers, validation
│   └── tests/
│       ├── unit/        # Isolated middleware/utility tests (6 suites)
│       ├── integration/ # API + MongoDB tests via Supertest (11 suites)
│       ├── system/      # Full REST + Socket.IO multi-client tests (2 suites)
│       └── helpers/     # Shared test factories and socket client utilities
├── frontend/            # React frontend (in development)
├── docs/                # Architecture, API, testing documentation
└── .github/workflows/   # GitHub Actions CI
```

---

## Quick Start (Backend)

### Prerequisites

- Node.js ≥ 18
- MongoDB instance (local or Atlas)

### Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### Health check

```
GET http://localhost:5000/api/health
→ 200 { "success": true, "message": "TaskFlow API is running" }
```

---

## Running Tests

See [`docs/testing.md`](docs/testing.md) for full documentation.

```bash
cd backend
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests (requires MONGO_URI_TEST)
npm run test:system        # System / realtime tests
npm test                   # All 193 tests
npm run test:coverage      # Coverage with CI thresholds
```

> **Important:** Integration and system tests require a dedicated `MONGO_URI_TEST` database. They never touch the development database. See `backend/.env.test.example`.

---

## Static Analysis

```bash
npm run lint               # Lint src + tests (fails on any warning)
npm run lint:src           # Lint src only
npm run lint:tests         # Lint tests only
```

---

## Documentation

| Document | Description |
|:---|:---|
| [`docs/api.md`](docs/api.md) | Complete REST API reference |
| [`docs/architecture.md`](docs/architecture.md) | System architecture and request flow |
| [`docs/authorization-matrix.md`](docs/authorization-matrix.md) | RBAC authorization matrix |
| [`docs/data-model.md`](docs/data-model.md) | Mongoose data models and relationships |
| [`docs/testing.md`](docs/testing.md) | Test strategy and evidence |
| [`docs/security.md`](docs/security.md) | Security measures |
| [`docs/devops.md`](docs/devops.md) | CI pipeline documentation |
| [`docs/coursework-evidence.md`](docs/coursework-evidence.md) | Evidence index for coursework |

---

## CI / CD

Every push and pull request on `main` that touches backend code runs the full GitHub Actions quality pipeline:

```
npm ci → lint → unit tests → integration tests → system tests → coverage gate → artifact upload
```

**CI: ✅ Implemented** | **CD/Deployment: not yet configured**

See [`.github/workflows/backend-ci.yml`](.github/workflows/backend-ci.yml).

---

## License

ISC

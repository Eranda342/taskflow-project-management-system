# TaskFlow — Project Management System

**TaskFlow** is a modern, real-time, full-stack project management system designed to help teams organize projects, manage tasks, collaborate seamlessly through comments, and stay updated with live notifications. The platform is built on a robust role-based access control (RBAC) framework to ensure secure and efficient workflows.

---

## 🏗️ Architecture

- **Frontend**: React (v19) + Vite + TailwindCSS v4
- **Backend**: Node.js (v24) + Express
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT-based with bcrypt password hashing
- **Real-Time**: Socket.IO for live updates across clients

---

## ✨ Features

- **Authentication**: Secure JWT-based registration and login with rate limiting.
- **Role-Based Access Control (RBAC)**: Fine-grained access control across all frontend routes and backend APIs.
- **Projects**: Create, update, and manage project lifecycles. Assign members and control visibility based on roles.
- **Tasks**: Create, assign, and track tasks. Monitor status, priority, and deadlines with real-time updates.
- **Comments**: Per-task commenting system to keep collaboration context-rich.
- **Real-Time Notifications**: Durable inbox with unread counts and instant alerts via Socket.IO.
- **Profiles**: Personalised dashboards for role-scoped overviews, including profile photo uploads and management.
- **Admin Dashboard**: Comprehensive user management, user activation/deactivation, and project ownership transfers.
- **Admin Analytics & Reporting**: Deep insights into platform metrics, complete with downloadable PDF reports containing high-resolution visual charts (via `html-to-image` and `jspdf`).

*(Note: Features like password resets and user invitations are deliberately out of scope for the current system.)*

---

## 👥 User Roles

| Role | Capabilities |
|:---|:---|
| **Admin** | Full platform access; manages users, views analytics, transfers project ownership. |
| **Project Manager** | Creates and manages own projects, assigns tasks, adds/removes project members. |
| **Team Member** | Views accessible projects, updates assigned task statuses, participates in comments. |

> **Note:** Public registration always creates a `Team Member` account. Elevating a user to Admin or Project Manager requires an existing Admin or database access.

---

## 📂 Project Structure

```text
taskflow-project-management-system/
├── backend/             # Node.js/Express API
│   ├── src/
│   │   ├── config/      # Database and environment configurations
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth, RBAC, error handling, rate limiting
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/      # Express API routes
│   │   ├── services/    # Business logic (e.g., notifications)
│   │   └── socket/      # Socket.IO server and room management
│   └── tests/           # Unit, Integration, and System tests
├── frontend/            # React/Vite Frontend Application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React Context (Auth, Socket)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities (Axios config, Socket client)
│   │   └── pages/       # Application views (Auth, Dashboard, Admin, etc.)
└── docs/                # Architecture, API, and testing documentation
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** (v18 or higher recommended; developed on v24.x)
- **MongoDB** instance (local or Atlas cluster)

### 1. Backend Setup

```bash
cd backend
npm install
```

**Environment Variables**:
Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
```

**Start the Backend**:
```bash
npm run dev   # Starts the server with nodemon
```
*Health Check: Navigate to `http://localhost:5000/api/health` to confirm the API is running.*

### 2. Frontend Setup

```bash
cd frontend
npm install
```

**Environment Variables**:
Create a `.env` file in the `frontend/` directory based on `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**Start the Frontend**:
```bash
npm run dev   # Starts the Vite development server on port 3000
```

### 3. Creating the First Admin Account

For security, TaskFlow does not include automated Admin seed scripts or hardcoded credentials. To create your first Admin account:

1. Register a new user via the public `/register` frontend route. This creates a `team_member` account.
2. Connect to your MongoDB database using a tool like MongoDB Compass or `mongosh`.
3. Locate the `users` collection.
4. Find your user document and change the `role` field from `team_member` to `admin`.
5. Log in to the application to access the Admin dashboard.

---

## 🧪 Testing

The backend includes a comprehensive test suite (199 tests across 19 suites) covering Unit, Integration, and System/Real-time layers.

```bash
cd backend
npm test                   # Run all tests
npm run test:unit          # Run isolated unit tests
npm run test:integration   # Run integration tests (Requires MONGO_URI_TEST)
npm run test:system        # Run real-time Socket.IO tests
```

> **Important**: Integration and System tests require a dedicated test database to avoid corrupting development data. Configure `MONGO_URI_TEST` in a `backend/.env.test.example` equivalent file.

---

## 📦 Deployment

### Building the Frontend

To build the React frontend for production:

```bash
cd frontend
npm run build
```

This generates an optimized static bundle in the `frontend/dist` directory. Ensure that `VITE_API_URL` and `VITE_SOCKET_URL` are properly set in your production CI/CD environment, as they are explicitly required during the Vite build process.

### CI/CD Pipeline

TaskFlow includes GitHub Actions workflows for continuous integration. Every push and pull request to the `main` branch automatically runs formatting checks, linting, and the complete backend test suite to prevent regressions.


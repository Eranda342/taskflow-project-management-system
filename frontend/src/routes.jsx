import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./layouts/MainLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { TeamDashboard } from "./pages/TeamDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetails } from "./pages/ProjectDetails";
import { Tasks } from "./pages/Tasks";
import { TaskDetails } from "./pages/TaskDetails";
import { MyTasks } from "./pages/MyTasks";
import { Notifications } from "./pages/Notifications";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminUserDetails } from "./pages/admin/AdminUserDetails";
import { AdminProjects } from "./pages/admin/AdminProjects";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { NotFound } from "./pages/NotFound";
import { Forbidden } from "./pages/Forbidden";
import { ServerError } from "./pages/ServerError";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { useApp } from "./context/AppContext";

function FullScreenSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuth, authLoading } = useApp();
  if (authLoading) return <FullScreenSpinner />;
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}

function PublicAuthRoute({ children }) {
  const { isAuth, authLoading } = useApp();
  if (authLoading) return <FullScreenSpinner />;
  if (isAuth) return <Navigate to="/app/dashboard" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, authLoading } = useApp();
  if (authLoading) return <FullScreenSpinner />;
  if (!user || user.role !== "admin") return <Navigate to="/403" replace />;
  return children;
}

export const router = createBrowserRouter([
  /* Public landing page */
  {
    path: "/",
    Component: Landing,
  },

  /* Auth pages */
  {
    path: "/",
    element: (
      <PublicAuthRoute>
        <AuthLayout />
      </PublicAuthRoute>
    ),
    children: [
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password", Component: ResetPassword },
    ],
  },

  /* Authenticated app */
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: "dashboard", Component: Dashboard },
      { path: "team-dashboard", Component: TeamDashboard },
      { path: "admin", element: <AdminRoute><AdminDashboard /></AdminRoute> },
      { path: "projects", Component: Projects },
      { path: "projects/:id", Component: ProjectDetails },
      { path: "tasks", Component: Tasks },
      { path: "tasks/:id", Component: TaskDetails },
      { path: "my-tasks", Component: MyTasks },
      { path: "notifications", Component: Notifications },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
      { path: "admin/users", element: <AdminRoute><AdminUsers /></AdminRoute> },
      { path: "admin/users/:userId", element: <AdminRoute><AdminUserDetails /></AdminRoute> },
      { path: "admin/projects", element: <AdminRoute><AdminProjects /></AdminRoute> },
      { path: "admin/analytics", element: <AdminRoute><AdminAnalytics /></AdminRoute> },
    ],
  },

  /* Error pages */
  { path: "/404", Component: NotFound },
  { path: "/403", Component: Forbidden },
  { path: "/500", Component: ServerError },

  /* Catch-all → landing */
  { path: "*", element: <Navigate to="/" replace /> },
]);

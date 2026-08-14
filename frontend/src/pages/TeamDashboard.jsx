import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CheckSquare, Clock, AlertCircle, FolderOpen, Bell, TrendingUp } from "lucide-react";
import { StatusBadge, PriorityBadge, Avatar } from "../components/Badge";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

export function TeamDashboard() {
  const { user, addToast } = useApp();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard");
        if (res.data.success) {
          setData(res.data.data);
        } else {
          throw new Error(res.data.message || "Failed to load dashboard data");
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Error loading dashboard";
        setError(msg);
        addToast("error", msg);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [addToast]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Failed to load dashboard</h2>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const myTasksCount = data.myTasks?.total || 0;
  const myProjectsCount = data.projects?.total || 0;
  const activeProjectsCount = data.projects?.active || 0;
  const inProgressCount = data.myTasks?.inProgress || 0;
  const completedCount = data.myTasks?.completed || 0;
  const overdueCount = data.myTasks?.overdue || 0;

  const recentTasks = data.recentAssignedTasks || [];
  const recentProjects = data.recentProjects || [];
  const upcomingDeadlines = data.upcomingDeadlines || [];
  
  // Dashboard API doesn't return full notifications list, only unread count.
  const unreadNotifsCount = data.notifications?.unread || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Good morning, {user?.name ? user.name.split(" ")[0] : "there"} 👋</h2>
        <p className="text-slate-500 mt-1">Here's a quick look at your tasks and projects for today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MiniStat label="My Projects" value={myProjectsCount} icon={<FolderOpen className="w-5 h-5" />} color="blue" />
        <MiniStat label="Active Projects" value={activeProjectsCount} icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
        <MiniStat label="My Tasks" value={myTasksCount} icon={<CheckSquare className="w-5 h-5" />} color="blue" />
        <MiniStat label="In Progress" value={inProgressCount} icon={<Clock className="w-5 h-5" />} color="indigo" />
        <MiniStat label="Completed" value={completedCount} icon={<CheckSquare className="w-5 h-5" />} color="emerald" />
        <MiniStat label="Overdue" value={overdueCount} icon={<AlertCircle className="w-5 h-5" />} color="red" alert={overdueCount > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: My Tasks */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">My Tasks</h3>
              <Link to="/app/my-tasks" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentTasks.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500">No tasks found.</div>
              ) : recentTasks.map((task) => {
                const project = task.project;
                const isOverdue = task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();
                return (
                  <Link
                    key={task._id}
                    to={`/app/tasks/${task._id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate group-hover:text-blue-600 transition-colors ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-900"}`}>
                        {task.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{project?.name}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                      <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : "text-slate-500"}`}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No due date"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* My Projects */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">My Projects</h3>
              <Link to="/app/projects" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentProjects.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500">No projects found.</div>
              ) : recentProjects.map((proj) => {
                return (
                  <Link
                    key={proj._id}
                    to={`/app/projects/${proj._id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{proj.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{proj.description}</div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <StatusBadge status={proj.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Upcoming deadlines */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Upcoming Deadlines</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingDeadlines.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500 text-sm">No upcoming deadlines.</div>
              ) : upcomingDeadlines.map((task) => {
                  const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / 86400000);
                  return (
                    <Link key={task._id} to={`/app/tasks/${task._id}`} className="block px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="text-sm font-medium text-slate-900 truncate">{task.title}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500">{task.project?.name ?? ""}</span>
                        <span className={`text-xs font-semibold ${daysLeft < 0 ? "text-red-600" : daysLeft <= 3 ? "text-amber-600" : "text-slate-600"}`}>
                          {daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                        </span>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Notifications</h3>
              <Link to="/app/notifications" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-medium">You have {unreadNotifsCount} unread notification{unreadNotifsCount !== 1 && "s"}</p>
              <Link to="/app/notifications" className="inline-block mt-3 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                Go to Inbox
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon, color, alert }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    indigo: "text-indigo-600 bg-indigo-50",
    red: "text-red-600 bg-red-50",
  };
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${alert ? "border-red-200" : "border-slate-200"}`}>
      <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>{icon}</div>
      <div className={`text-2xl font-bold ${alert ? "text-red-600" : "text-slate-900"}`}>{value !== undefined ? value : "-"}</div>
      <div className="text-xs text-slate-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

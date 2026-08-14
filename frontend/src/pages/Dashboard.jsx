import { useEffect, useState } from "react";
import { Link } from "react-router";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

export function Dashboard() {
  const { user, addToast } = useApp();
  const userName = user?.name ? user.name.split(" ")[0] : "there";

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

  // Adapt for both project_manager and team_member if needed, though this is primarily for PM
  const isPM = data.role === "project_manager";
  
  const totalProjects = isPM ? data.projects?.totalAccessible : data.projects?.total;
  const activeProjects = data.projects?.active;
  
  const tasksData = isPM ? data.tasks : data.myTasks;
  const totalTasks = isPM ? tasksData?.totalAccessible : tasksData?.total;
  const overdueTasks = tasksData?.overdue;
  const completedTasks = tasksData?.completed;

  const recentProjects = data.recentProjects || [];
  const recentTasks = data.recentTasks || data.recentAssignedTasks || [];
  const upcomingDeadlines = data.upcomingDeadlines || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Good morning, {userName} 👋</h2>
          <p className="text-slate-500 mt-1">Here's what's happening with your projects today.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => addToast("info", "Create project modal — see Projects page")}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Project
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={totalProjects} trend="Across your teams" color="blue" />
        <StatCard title="Active Projects" value={activeProjects} trend="Currently active" color="emerald" />
        <StatCard title="Total Tasks" value={totalTasks} trend={`${completedTasks} completed`} color="indigo" />
        <StatCard title="Overdue Tasks" value={overdueTasks} trend="Needs attention" color="red" alert={overdueTasks > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Projects Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-900">Recent Projects</h3>
              <Link to="/app/projects" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Project</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentProjects.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">No projects found.</td></tr>
                  ) : recentProjects.map((proj) => (
                    <tr key={proj._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link to={`/app/projects/${proj._id}`} className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors block">
                          {proj.name}
                        </Link>
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{proj.description}</div>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={proj.status} /></td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {proj.deadline ? new Date(proj.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-900">{isPM ? "Recent Tasks" : "Recent Assigned Tasks"}</h3>
              <Link to="/app/tasks" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentTasks.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500">No tasks found.</div>
              ) : recentTasks.map((task) => {
                const assignee = task.assignedTo;
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
                      {assignee && <div className="text-xs text-slate-500 mt-0.5">{assignee.name}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
        </div>

        {/* Right (1/3) */}
        <div className="space-y-6">
          {/* Task Status Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-5">Task Status</h3>
            <div className="space-y-3">
              {[
                { label: "To Do", count: tasksData?.todo || 0, color: "bg-slate-500" },
                { label: "In Progress", count: tasksData?.inProgress || 0, color: "bg-blue-600" },
                { label: "Review", count: tasksData?.review || 0, color: "bg-amber-500" },
                { label: "Completed", count: tasksData?.completed || 0, color: "bg-green-600" },
              ].map((item) => (
                <Link to="/app/tasks" key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-blue-200 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="font-medium text-slate-700 text-sm">{item.label}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.count}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
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
                    <div className="font-medium text-slate-900 text-sm truncate">{task.title}</div>
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
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center">
              <Link to="/app/tasks" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all tasks</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, color, alert }) {
  return (
    <div className={`bg-white p-6 rounded-xl border shadow-sm ${alert ? "border-red-200" : "border-slate-200"}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      </div>
      <div className="text-3xl font-bold tracking-tight text-slate-900 mb-1">{value !== undefined ? value : "-"}</div>
      <p className={`text-xs font-medium ${alert ? "text-red-500" : "text-slate-500"}`}>{trend}</p>
    </div>
  );
}

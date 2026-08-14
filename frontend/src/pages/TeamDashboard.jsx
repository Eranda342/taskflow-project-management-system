import { Link } from "react-router";
import { CheckSquare, Clock, AlertCircle, FolderOpen, Bell, TrendingUp } from "lucide-react";
import { TASKS, PROJECTS, NOTIFICATIONS, USERS, getProject, getUser, formatDate, timeAgo } from "../data/mockData";
import { StatusBadge, PriorityBadge, Avatar } from "../components/Badge";

const MEMBER_ID = "u3"; // David Kim

export function TeamDashboard() {
  const myTasks = TASKS.filter((t) => t.assigneeId === MEMBER_ID);
  const myProjects = PROJECTS.filter((p) => p.memberIds.includes(MEMBER_ID));
  const inProgress = myTasks.filter((t) => t.status === "in_progress");
  const completed = myTasks.filter((t) => t.status === "completed");
  const overdue = myTasks.filter((t) => t.status !== "completed" && new Date(t.dueDate) < new Date("2026-08-12"));
  const unreadNotifs = NOTIFICATIONS.filter((n) => !n.isRead);
  const user = getUser(MEMBER_ID);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Good morning, {user?.name.split(" ")[0]} 👋</h2>
        <p className="text-slate-500 mt-1">Here's a quick look at your tasks and projects for today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MiniStat label="My Projects" value={myProjects.length} icon={<FolderOpen className="w-5 h-5" />} color="blue" />
        <MiniStat label="Active Projects" value={myProjects.filter((p) => p.status === "active").length} icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
        <MiniStat label="My Tasks" value={myTasks.length} icon={<CheckSquare className="w-5 h-5" />} color="blue" />
        <MiniStat label="In Progress" value={inProgress.length} icon={<Clock className="w-5 h-5" />} color="indigo" />
        <MiniStat label="Completed" value={completed.length} icon={<CheckSquare className="w-5 h-5" />} color="emerald" />
        <MiniStat label="Overdue" value={overdue.length} icon={<AlertCircle className="w-5 h-5" />} color="red" alert={overdue.length > 0} />
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
              {myTasks.slice(0, 6).map((task) => {
                const project = getProject(task.projectId);
                const isOverdue = task.status !== "completed" && new Date(task.dueDate) < new Date("2026-08-12");
                return (
                  <Link
                    key={task.id}
                    to={`/app/tasks/${task.id}`}
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
                        {formatDate(task.dueDate)}
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
              {myProjects.map((proj) => {
                const owner = getUser(proj.ownerId);
                return (
                  <Link
                    key={proj.id}
                    to={`/app/projects/${proj.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{proj.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{proj.description}</div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <StatusBadge status={proj.status} />
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 w-8">{proj.progress}%</span>
                      </div>
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
              {myTasks
                .filter((t) => t.status !== "completed")
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 4)
                .map((task) => {
                  const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - new Date("2026-08-12").getTime()) / 86400000);
                  return (
                    <Link key={task.id} to={`/app/tasks/${task.id}`} className="block px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="text-sm font-medium text-slate-900 truncate">{task.title}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500">{formatDate(task.dueDate)}</span>
                        <span className={`text-xs font-semibold ${daysLeft <= 0 ? "text-red-600" : daysLeft <= 3 ? "text-amber-600" : "text-slate-600"}`}>
                          {daysLeft <= 0 ? "Overdue" : `${daysLeft}d left`}
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
            <div className="divide-y divide-slate-100">
              {NOTIFICATIONS.slice(0, 4).map((notif) => (
                <div key={notif.id} className={`px-6 py-4 flex gap-3 ${!notif.isRead ? "bg-blue-50/40" : ""}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!notif.isRead ? "bg-blue-600" : "bg-slate-200"}`} />
                  <div>
                    <p className="text-xs text-slate-700 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              ))}
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
      <div className={`text-2xl font-bold ${alert ? "text-red-600" : "text-slate-900"}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

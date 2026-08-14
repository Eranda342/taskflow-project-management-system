import { Link } from "react-router";
import { Users, FolderKanban, CheckSquare, MessageSquare, Bell } from "lucide-react";
import { USERS, PROJECTS, TASKS, NOTIFICATIONS, COMMENTS } from "../data/mockData";

function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = 40;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const slice = { ...seg, dashArray: `${dash} ${gap}`, dashOffset: -offset * circumference };
    offset += pct;
    return slice;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={20} />
      {slices.map((slice, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={slice.color}
          strokeWidth={20}
          strokeDasharray={slice.dashArray}
          strokeDashoffset={slice.dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="text-slate-900" fontSize="16" fontWeight="700" fill="#0f172a">
        {total}
      </text>
    </svg>
  );
}

function BarChart({ bars }) {
  return (
    <div className="space-y-3">
      {bars.map((bar, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
            <span>{bar.label}</span>
            <span>{bar.value}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${(bar.value / bar.max) * 100}%`, backgroundColor: bar.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const totalUsers = USERS.length;
  const activeUsers = USERS.filter((u) => u.status === "active").length;
  const totalProjects = PROJECTS.length;
  const totalTasks = TASKS.length;
  const totalComments = COMMENTS.length;
  const unreadNotifs = NOTIFICATIONS.filter((n) => !n.isRead).length;

  const usersByRole = [
    { label: "Admin", value: USERS.filter((u) => u.role === "admin").length, color: "#DC2626" },
    { label: "Project Manager", value: USERS.filter((u) => u.role === "project_manager").length, color: "#2563EB" },
    { label: "Team Member", value: USERS.filter((u) => u.role === "team_member").length, color: "#16A34A" },
  ];

  const projectsByStatus = [
    { label: "Active", value: PROJECTS.filter((p) => p.status === "active").length, color: "#2563EB" },
    { label: "Review", value: PROJECTS.filter((p) => p.status === "review").length, color: "#D97706" },
    { label: "Planning", value: PROJECTS.filter((p) => p.status === "planning").length, color: "#64748B" },
    { label: "On Hold", value: PROJECTS.filter((p) => p.status === "on_hold").length, color: "#94A3B8" },
    { label: "Completed", value: PROJECTS.filter((p) => p.status === "completed").length, color: "#16A34A" },
  ];

  const tasksByStatus = [
    { label: "To Do", value: TASKS.filter((t) => t.status === "todo").length, color: "#64748B", max: TASKS.length },
    { label: "In Progress", value: TASKS.filter((t) => t.status === "in_progress").length, color: "#2563EB", max: TASKS.length },
    { label: "Review", value: TASKS.filter((t) => t.status === "review").length, color: "#D97706", max: TASKS.length },
    { label: "Completed", value: TASKS.filter((t) => t.status === "completed").length, color: "#16A34A", max: TASKS.length },
  ];

  const tasksByPriority = [
    { label: "Urgent", value: TASKS.filter((t) => t.priority === "urgent").length, color: "#DC2626", max: TASKS.length },
    { label: "High", value: TASKS.filter((t) => t.priority === "high").length, color: "#D97706", max: TASKS.length },
    { label: "Medium", value: TASKS.filter((t) => t.priority === "medium").length, color: "#2563EB", max: TASKS.length },
    { label: "Low", value: TASKS.filter((t) => t.priority === "low").length, color: "#64748B", max: TASKS.length },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Platform Analytics</h2>
          <p className="text-slate-500 mt-1">System-wide overview — users, projects, tasks, and activity.</p>
        </div>
        <Link to="/app/admin/analytics" className="text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
          Full Analytics →
        </Link>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <AdminStatCard label="Total Users" value={totalUsers} icon={<Users className="w-5 h-5" />} color="blue" to="/app/admin/users" />
        <AdminStatCard label="Active Users" value={activeUsers} icon={<Users className="w-5 h-5" />} color="emerald" to="/app/admin/users" />
        <AdminStatCard label="Total Projects" value={totalProjects} icon={<FolderKanban className="w-5 h-5" />} color="indigo" to="/app/admin/projects" />
        <AdminStatCard label="Total Tasks" value={totalTasks} icon={<CheckSquare className="w-5 h-5" />} color="violet" to="/app/tasks" />
        <AdminStatCard label="Comments" value={totalComments} icon={<MessageSquare className="w-5 h-5" />} color="teal" />
        <AdminStatCard label="Unread Alerts" value={unreadNotifs} icon={<Bell className="w-5 h-5" />} color="amber" to="/app/notifications" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Users by Role */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-6">Users by Role</h3>
          <div className="flex flex-col items-center gap-6">
            <DonutChart segments={usersByRole} />
            <div className="w-full space-y-2">
              {usersByRole.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
                    <span className="text-slate-600 text-xs">{seg.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900 text-xs">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projects by Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-6">Projects by Status</h3>
          <div className="flex flex-col items-center gap-6">
            <DonutChart segments={projectsByStatus} />
            <div className="w-full space-y-2">
              {projectsByStatus.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
                    <span className="text-slate-600 text-xs">{seg.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900 text-xs">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks by Status + Priority */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Tasks by Status</h3>
            <BarChart bars={tasksByStatus} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Tasks by Priority</h3>
            <BarChart bars={tasksByPriority} />
          </div>
        </div>
      </div>

      {/* Recent users + projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Recent Users</h3>
            <Link to="/app/admin/users" className="text-sm font-medium text-blue-600 hover:text-blue-700">Manage users</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {USERS.slice(0, 5).map((user) => (
              <Link key={user.id} to={`/app/admin/users/${user.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors group">
                <div className={`w-9 h-9 rounded-full ${user.color} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RoleBadge role={user.role} />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${user.status === "active" ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                    {user.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Platform Projects */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Platform Projects</h3>
            <Link to="/app/admin/projects" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {PROJECTS.map((proj) => (
              <Link key={proj.id} to={`/app/projects/${proj.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">{proj.name}</div>
                  <div className="text-xs text-slate-500">{proj.memberIds.length} members · {proj.tasksTotal} tasks</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-20 bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${proj.progress}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-8">{proj.progress}%</span>
                  </div>
                  <ProjectStatusDot status={proj.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ label, value, icon, color, to }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    teal: "bg-teal-50 text-teal-600",
    amber: "bg-amber-50 text-amber-600",
  };
  const inner = (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-300 transition-colors">
      <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : <div>{inner}</div>;
}

function RoleBadge({ role }) {
  const map = {
    admin: "bg-red-50 text-red-700 border border-red-200",
    project_manager: "bg-blue-50 text-blue-700 border border-blue-200",
    team_member: "bg-slate-100 text-slate-700 border border-slate-200",
  };
  const labels = {
    admin: "Admin",
    project_manager: "PM",
    team_member: "Member",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${map[role]}`}>
      {labels[role]}
    </span>
  );
}

function ProjectStatusDot({ status }) {
  const colors = {
    active: "bg-blue-500",
    review: "bg-amber-500",
    planning: "bg-slate-400",
    on_hold: "bg-slate-300",
    completed: "bg-green-500",
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status] ?? "bg-slate-300"}`} />;
}

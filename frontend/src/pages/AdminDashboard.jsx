import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Users, FolderKanban, CheckSquare, MessageSquare, Bell } from "lucide-react";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = 40;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
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
              style={{ width: `${bar.max > 0 ? (bar.value / bar.max) * 100 : 0}%`, backgroundColor: bar.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const { addToast } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        if (res.data.success) {
          setData(res.data.data);
        } else {
          throw new Error(res.data.message || "Failed to load admin stats");
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Error loading admin stats";
        setError(msg);
        addToast("error", msg);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
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
        <h2 className="text-xl font-bold text-red-600 mb-2">Failed to load admin dashboard</h2>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const totalUsers = data.totals?.users || 0;
  const activeUsers = data.usersByStatus?.active || 0;
  const totalProjects = data.totals?.projects || 0;
  const totalTasks = data.totals?.tasks || 0;
  const totalComments = data.totals?.comments || 0;
  const unreadNotifs = data.totals?.notifications || 0; // The stats API returns total notifications across platform

  const usersByRole = [
    { label: "Admin", value: data.usersByRole?.admin || 0, color: "#DC2626" },
    { label: "Project Manager", value: data.usersByRole?.project_manager || 0, color: "#2563EB" },
    { label: "Team Member", value: data.usersByRole?.team_member || 0, color: "#16A34A" },
  ];

  const projectsByStatus = [
    { label: "Active", value: data.projectsByStatus?.active || 0, color: "#2563EB" },
    { label: "Planning", value: data.projectsByStatus?.planning || 0, color: "#64748B" },
    { label: "On Hold", value: data.projectsByStatus?.on_hold || 0, color: "#94A3B8" },
    { label: "Completed", value: data.projectsByStatus?.completed || 0, color: "#16A34A" },
    { label: "Cancelled", value: data.projectsByStatus?.cancelled || 0, color: "#DC2626" },
  ];

  const tasksByStatus = [
    { label: "To Do", value: data.tasksByStatus?.todo || 0, color: "#64748B", max: totalTasks },
    { label: "In Progress", value: data.tasksByStatus?.in_progress || 0, color: "#2563EB", max: totalTasks },
    { label: "Review", value: data.tasksByStatus?.review || 0, color: "#D97706", max: totalTasks },
    { label: "Completed", value: data.tasksByStatus?.completed || 0, color: "#16A34A", max: totalTasks },
  ];

  const tasksByPriority = [
    { label: "Urgent", value: data.tasksByPriority?.urgent || 0, color: "#DC2626", max: totalTasks },
    { label: "High", value: data.tasksByPriority?.high || 0, color: "#D97706", max: totalTasks },
    { label: "Medium", value: data.tasksByPriority?.medium || 0, color: "#2563EB", max: totalTasks },
    { label: "Low", value: data.tasksByPriority?.low || 0, color: "#64748B", max: totalTasks },
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
        <AdminStatCard label="Total Alerts" value={unreadNotifs} icon={<Bell className="w-5 h-5" />} color="amber" />
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

      {/* Recent Activity (API doesn't return full user/project lists for stats endpoint) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">Recent Activity (Last 7 Days)</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
            <div className="text-sm font-medium text-slate-500 mb-1">New Users</div>
            <div className="text-2xl font-bold text-slate-900">{data.recentActivity?.usersCreatedLast7Days || 0}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
            <div className="text-sm font-medium text-slate-500 mb-1">New Projects</div>
            <div className="text-2xl font-bold text-slate-900">{data.recentActivity?.projectsCreatedLast7Days || 0}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
            <div className="text-sm font-medium text-slate-500 mb-1">New Tasks</div>
            <div className="text-2xl font-bold text-slate-900">{data.recentActivity?.tasksCreatedLast7Days || 0}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
            <div className="text-sm font-medium text-slate-500 mb-1">New Comments</div>
            <div className="text-2xl font-bold text-slate-900">{data.recentActivity?.commentsCreatedLast7Days || 0}</div>
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
      <div className="text-2xl font-bold text-slate-900">{value !== undefined ? value : "-"}</div>
      <div className="text-xs text-slate-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : <div>{inner}</div>;
}

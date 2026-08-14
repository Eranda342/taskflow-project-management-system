import { USERS, PROJECTS, TASKS } from "../../data/mockData";

function DonutChart({ segments, size = 160, label }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  const r = 55;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circ;
    const gap = circ - dash;
    const slice = { ...seg, dashArray: `${dash} ${gap}`, dashOffset: -offset * circ };
    offset += pct;
    return slice;
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={24} />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={24} strokeDasharray={s.dashArray} strokeDashoffset={s.dashOffset} transform={`rotate(-90 ${cx} ${cy})`} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a">{total}</text>
        {label && <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#64748b">{label}</text>}
      </svg>
    </div>
  );
}

function HBarChart({ bars, maxVal }) {
  const max = maxVal ?? Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="space-y-3">
      {bars.map((bar, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-700">{bar.label}</span>
            <span className="text-slate-500">{bar.value}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${(bar.value / max) * 100}%`, backgroundColor: bar.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function LineSparkline({ points, color = "#2563EB" }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 200;
  const h = 60;
  const step = w / (points.length - 1);
  const pts = points.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminAnalytics() {
  const totalUsers = USERS.length;
  const activeUsers = USERS.filter((u) => u.status === "active").length;
  const totalProjects = PROJECTS.length;
  const completedProjects = PROJECTS.filter((p) => p.status === "completed").length;
  const totalTasks = TASKS.length;
  const completedTasks = TASKS.filter((t) => t.status === "completed").length;

  const usersByRole = [
    { label: "Admin", value: USERS.filter((u) => u.role === "admin").length, color: "#DC2626" },
    { label: "Project Manager", value: USERS.filter((u) => u.role === "project_manager").length, color: "#2563EB" },
    { label: "Team Member", value: USERS.filter((u) => u.role === "team_member").length, color: "#16A34A" },
  ];
  const usersByStatus = [
    { label: "Active", value: activeUsers, color: "#16A34A" },
    { label: "Inactive", value: totalUsers - activeUsers, color: "#94A3B8" },
  ];
  const projectsByStatus = [
    { label: "Active", value: PROJECTS.filter((p) => p.status === "active").length, color: "#2563EB" },
    { label: "Review", value: PROJECTS.filter((p) => p.status === "review").length, color: "#D97706" },
    { label: "Planning", value: PROJECTS.filter((p) => p.status === "planning").length, color: "#64748B" },
    { label: "On Hold", value: PROJECTS.filter((p) => p.status === "on_hold").length, color: "#94A3B8" },
    { label: "Completed", value: completedProjects, color: "#16A34A" },
  ];
  const tasksByStatus = [
    { label: "To Do", value: TASKS.filter((t) => t.status === "todo").length, color: "#64748B" },
    { label: "In Progress", value: TASKS.filter((t) => t.status === "in_progress").length, color: "#2563EB" },
    { label: "Review", value: TASKS.filter((t) => t.status === "review").length, color: "#D97706" },
    { label: "Completed", value: completedTasks, color: "#16A34A" },
  ];
  const tasksByPriority = [
    { label: "Urgent", value: TASKS.filter((t) => t.priority === "urgent").length, color: "#DC2626" },
    { label: "High", value: TASKS.filter((t) => t.priority === "high").length, color: "#D97706" },
    { label: "Medium", value: TASKS.filter((t) => t.priority === "medium").length, color: "#2563EB" },
    { label: "Low", value: TASKS.filter((t) => t.priority === "low").length, color: "#64748B" },
  ];

  // Mock weekly task completion trend
  const weeklyTrend = [2, 5, 3, 7, 4, 6, 8, 5, 9, 7, 11, 8];
  const weeklyUsers = [12, 13, 14, 13, 15, 15, 16, 17, 17, 18, 18, 19];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Platform Analytics</h2>
        <p className="text-slate-500 mt-1">Detailed metrics across users, projects, and tasks.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Users", value: totalUsers, sub: `${activeUsers} active`, color: "text-blue-600" },
          { label: "Inactive Users", value: totalUsers - activeUsers, sub: "need attention", color: "text-amber-600" },
          { label: "Total Projects", value: totalProjects, sub: `${completedProjects} completed`, color: "text-indigo-600" },
          { label: "Total Tasks", value: totalTasks, sub: `${completedTasks} done`, color: "text-violet-600" },
          { label: "Completion Rate", value: `${Math.round((completedTasks / totalTasks) * 100)}%`, sub: "tasks done", color: "text-emerald-600" },
          { label: "Overdue Tasks", value: TASKS.filter((t) => t.status !== "completed" && new Date(t.dueDate) < new Date("2026-08-12")).length, sub: "need action", color: "text-red-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">{kpi.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Task Completions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 12 weeks</p>
            </div>
            <span className="text-lg font-bold text-emerald-600">↑ 23%</span>
          </div>
          <LineSparkline points={weeklyTrend} color="#2563EB" />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>12w ago</span><span>Now</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Active Users</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 12 weeks</p>
            </div>
            <span className="text-lg font-bold text-emerald-600">↑ 58%</span>
          </div>
          <LineSparkline points={weeklyUsers} color="#16A34A" />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>12w ago</span><span>Now</span>
          </div>
        </div>
      </div>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ChartCard title="Users by Role" segments={usersByRole}>
          <DonutChart segments={usersByRole} size={140} label="users" />
        </ChartCard>

        <ChartCard title="Users by Status" segments={usersByStatus}>
          <DonutChart segments={usersByStatus} size={140} label="users" />
        </ChartCard>

        <ChartCard title="Projects by Status" segments={projectsByStatus}>
          <DonutChart segments={projectsByStatus} size={140} label="projects" />
        </ChartCard>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Tasks by Status</h3>
            <HBarChart bars={tasksByStatus} maxVal={totalTasks} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Tasks by Priority</h3>
            <HBarChart bars={tasksByPriority} maxVal={totalTasks} />
          </div>
        </div>
      </div>

      {/* Project progress table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">Project Progress Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Project</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Members</th>
                <th className="px-6 py-3 font-medium">Tasks</th>
                <th className="px-6 py-3 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PROJECTS.map((proj) => (
                <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{proj.name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                      proj.status === "active" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      proj.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                      proj.status === "review" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>{proj.status}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{proj.memberIds.length}</td>
                  <td className="px-6 py-4 text-slate-600">{proj.tasksCompleted}/{proj.tasksTotal}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${proj.status === "completed" ? "bg-green-500" : "bg-blue-600"}`}
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600 w-8">{proj.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, segments, children }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="flex justify-center mb-4">{children}</div>
      <div className="space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
              <span className="text-slate-600">{seg.label}</span>
            </div>
            <span className="font-semibold text-slate-800">{seg.value} <span className="text-slate-400 font-normal">({Math.round((seg.value / total) * 100)}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

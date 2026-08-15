import { useState, useEffect } from "react";
import api from "../../lib/api";
import { useApp } from "../../context/AppContext";

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

export function AdminAnalytics() {
  const { addToast } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get("/admin/stats");
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        addToast("error", error.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [addToast]);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto py-24 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const {
    usersByRole: rRole,
    usersByStatus: rUserStatus,
    projectsByStatus: rProjStatus,
    tasksByStatus: rTaskStatus,
    tasksByPriority: rTaskPriority,
    totals,
  } = data;

  const usersByRole = [
    { label: "Admin", value: rRole.admin || 0, color: "#DC2626" },
    { label: "Project Manager", value: rRole.project_manager || 0, color: "#2563EB" },
    { label: "Team Member", value: rRole.team_member || 0, color: "#16A34A" },
  ];
  const usersByStatus = [
    { label: "Active", value: rUserStatus.active || 0, color: "#16A34A" },
    { label: "Inactive", value: rUserStatus.inactive || 0, color: "#94A3B8" },
  ];
  const projectsByStatus = [
    { label: "Active", value: rProjStatus.active || 0, color: "#2563EB" },
    { label: "Review", value: rProjStatus.review || 0, color: "#D97706" },
    { label: "Planning", value: rProjStatus.planning || 0, color: "#64748B" },
    { label: "On Hold", value: rProjStatus.on_hold || 0, color: "#94A3B8" },
    { label: "Completed", value: rProjStatus.completed || 0, color: "#16A34A" },
  ];
  const tasksByStatus = [
    { label: "To Do", value: rTaskStatus.todo || 0, color: "#64748B" },
    { label: "In Progress", value: rTaskStatus.in_progress || 0, color: "#2563EB" },
    { label: "Review", value: rTaskStatus.review || 0, color: "#D97706" },
    { label: "Completed", value: rTaskStatus.completed || 0, color: "#16A34A" },
  ];
  const tasksByPriority = [
    { label: "Urgent", value: rTaskPriority.urgent || 0, color: "#DC2626" },
    { label: "High", value: rTaskPriority.high || 0, color: "#D97706" },
    { label: "Medium", value: rTaskPriority.medium || 0, color: "#2563EB" },
    { label: "Low", value: rTaskPriority.low || 0, color: "#64748B" },
  ];

  const completionRate = totals.tasks > 0 
    ? Math.round((rTaskStatus.completed / totals.tasks) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Platform Analytics</h2>
        <p className="text-slate-500 mt-1">Detailed metrics across users, projects, and tasks.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Users", value: totals.users, sub: `${rUserStatus.active || 0} active`, color: "text-blue-600" },
          { label: "Inactive Users", value: rUserStatus.inactive || 0, sub: "need attention", color: "text-amber-600" },
          { label: "Total Projects", value: totals.projects, sub: `${rProjStatus.completed || 0} completed`, color: "text-indigo-600" },
          { label: "Total Tasks", value: totals.tasks, sub: `${rTaskStatus.completed || 0} done`, color: "text-violet-600" },
          { label: "Completion Rate", value: `${completionRate}%`, sub: "tasks done", color: "text-emerald-600" },
          { label: "Total Comments", value: totals.comments || 0, sub: "platform wide", color: "text-slate-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">{kpi.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
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
            <HBarChart bars={tasksByStatus} maxVal={totals.tasks} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Tasks by Priority</h3>
            <HBarChart bars={tasksByPriority} maxVal={totals.tasks} />
          </div>
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
            <span className="font-semibold text-slate-800">{seg.value} <span className="text-slate-400 font-normal">({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

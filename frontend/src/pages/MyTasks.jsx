import { useState } from "react";
import { Link } from "react-router";
import { Search, Plus, CheckSquare } from "lucide-react";
import { TASKS, getProject, formatDate } from "../data/mockData";
import { StatusBadge, PriorityBadge, EmptyState } from "../components/Badge";
import { useApp } from "../context/AppContext";

const MEMBER_ID = "u3";

const TABS = [
  { id: "all", label: "All" },
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "completed", label: "Completed" },
  { id: "overdue", label: "Overdue" },
];

export function MyTasks() {
  const { addToast } = useApp();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const myTasks = TASKS.filter((t) => t.assigneeId === MEMBER_ID);

  const filtered = myTasks.filter((t) => {
    const matchTab =
      tab === "all" ? true :
      tab === "overdue" ? (t.status !== "completed" && new Date(t.dueDate) < new Date("2026-08-12")) :
      t.status === tab;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const matchProject = projectFilter === "all" || t.projectId === projectFilter;
    return matchTab && matchSearch && matchPriority && matchProject;
  });

  const uniqueProjects = [...new Set(myTasks.map((t) => t.projectId))];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Tasks</h2>
          <p className="text-slate-500 mt-1">{myTasks.length} tasks assigned to you.</p>
        </div>
        <button
          onClick={() => addToast("info", "Create task — coming soon")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const count =
            t.id === "all" ? myTasks.length :
            t.id === "overdue" ? myTasks.filter((task) => task.status !== "completed" && new Date(task.dueDate) < new Date("2026-08-12")).length :
            myTasks.filter((task) => task.status === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Projects</option>
          {uniqueProjects.map((pid) => {
            const p = getProject(pid);
            return p ? <option key={pid} value={pid}>{p.name}</option> : null;
          })}
        </select>
      </div>

      {/* Task list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-7 h-7" />}
            title="No tasks found"
            description="No tasks match your current filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Task</th>
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                  <th className="px-6 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((task) => {
                  const project = getProject(task.projectId);
                  const isOverdue = task.status !== "completed" && new Date(task.dueDate) < new Date("2026-08-12");
                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link
                          to={`/app/tasks/${task.id}`}
                          className={`font-medium group-hover:text-blue-600 transition-colors ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-900"}`}
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {project ? (
                          <Link to={`/app/projects/${project.id}`} className="hover:text-blue-600 transition-colors">
                            {project.name}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-6 py-4"><StatusBadge status={task.status} /></td>
                      <td className={`px-6 py-4 font-medium ${isOverdue ? "text-red-600" : "text-slate-600"}`}>
                        {formatDate(task.dueDate)}
                        {isOverdue && <span className="ml-1.5 text-xs">⚠</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(task.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

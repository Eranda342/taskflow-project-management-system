import { useState } from "react";
import { Search, Plus, Calendar, MessageSquare, AlertCircle } from "lucide-react";
import { Link } from "react-router";
import { TASKS, PROJECTS, USERS, getProject } from "../data/mockData";
import { Modal } from "../components/Modal";
import { useApp } from "../context/AppContext";

export function Tasks() {
  const { addToast } = useApp();
  const [view, setView] = useState("board");
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = TASKS.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const byStatus = (status) => filtered.filter((t) => t.status === status);

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tasks</h2>
          <p className="text-slate-500 mt-1">Manage and track all team tasks.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </button>
      </div>

      {/* View tabs */}
      <div className="flex gap-0 border-b border-slate-200 shrink-0">
        {["board", "list"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              view === v ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 shrink-0 flex-wrap">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {view === "board" ? (
        /* Kanban Board */
        <div className="flex-1 flex gap-5 overflow-x-auto pb-4 min-h-0">
          <KanbanColumn title="To Do" tasks={byStatus("todo")} color="bg-slate-500" />
          <KanbanColumn title="In Progress" tasks={byStatus("in_progress")} color="bg-blue-600" />
          <KanbanColumn title="Review" tasks={byStatus("review")} color="bg-amber-500" />
          <KanbanColumn title="Completed" tasks={byStatus("completed")} color="bg-green-600" />
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Task</th>
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((task) => {
                  const proj = getProject(task.projectId);
                  const isOverdue = task.status !== "completed" && new Date(task.dueDate) < new Date("2026-08-12");
                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link to={`/app/tasks/${task.id}`} className={`font-medium group-hover:text-blue-600 transition-colors ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-900"}`}>
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{proj?.name ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                          task.status === "todo" ? "bg-slate-100 text-slate-700 border-slate-200" :
                          task.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          task.status === "review" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-green-50 text-green-700 border-green-200"
                        }`}>{task.status.replace("_", " ")}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                          task.priority === "urgent" ? "bg-red-50 text-red-700 border-red-200" :
                          task.priority === "high" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          task.priority === "medium" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>{task.priority}</span>
                      </td>
                      <td className={`px-6 py-4 font-medium ${isOverdue ? "text-red-600" : "text-slate-600"}`}>
                        {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function KanbanColumn({ title, tasks, color }) {
  return (
    <div className="flex-shrink-0 w-72 flex flex-col bg-slate-100/50 rounded-xl border border-slate-200/60 max-h-full">
      <div className="p-4 flex items-center justify-between border-b border-slate-200/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        </div>
        <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">No tasks</div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task }) {
  const isOverdue = task.status !== "completed" && new Date(task.dueDate) < new Date("2026-08-12");
  const getPriorityColor = (p) => {
    if (task.status === "completed") return "bg-slate-100 text-slate-500";
    switch (p) {
      case "urgent": return "bg-red-50 text-red-700 border border-red-100";
      case "high": return "bg-amber-50 text-amber-700 border border-amber-100";
      case "medium": return "bg-blue-50 text-blue-700 border border-blue-100";
      default: return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <Link
      to={`/app/tasks/${task.id}`}
      className={`block bg-white p-4 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-all group ${
        task.status === "completed" ? "border-slate-200 opacity-75" : isOverdue ? "border-red-200" : "border-slate-200 hover:border-blue-300"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>
      <h4 className={`text-sm font-semibold mb-1 ${task.status === "completed" ? "text-slate-500 line-through" : "text-slate-900 group-hover:text-blue-600 transition-colors"}`}>
        {task.title}
      </h4>
      <p className="text-xs text-slate-500 mb-3">{getProject(task.projectId)?.name ?? ""}</p>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className={`flex items-center gap-1 font-medium ${isOverdue ? "text-red-600" : ""}`}>
          <Calendar className="w-3.5 h-3.5" />
          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
        <div className="flex items-center gap-2">
          {task.commentsCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {task.commentsCount}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function CreateTaskModal({ open, onClose }) {
  const { addToast } = useApp();
  const [form, setForm] = useState({ title: "", description: "", projectId: "", assigneeId: "", status: "todo", priority: "medium", dueDate: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast("success", "Task created successfully");
      onClose();
      setForm({ title: "", description: "", projectId: "", assigneeId: "", status: "todo", priority: "medium", dueDate: "" });
    }, 700);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Task title"
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Task description..."
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Project</label>
            <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select project</option>
              {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assignee</label>
            <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Unassigned</option>
              {USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-3 pt-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
}

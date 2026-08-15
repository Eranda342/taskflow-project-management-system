import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Calendar, MessageSquare, AlertCircle } from "lucide-react";
import { Link } from "react-router";
import { Modal } from "../components/Modal";
import CreateTaskModal from "../components/CreateTaskModal";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

export function Tasks() {
  const { addToast, user } = useApp();
  const [view, setView] = useState("board");
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects to populate the project selector
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get("/projects?limit=100");
        setProjects(data.data.projects || []);
        if (data.data.projects?.length > 0) {
          setSelectedProject(data.data.projects[0]._id);
        } else {
          setLoading(false); // No projects to fetch tasks for
        }
      } catch (err) {
        addToast("error", "Failed to load projects");
        setLoading(false);
      }
    };
    fetchProjects();
  }, [addToast]);

  // Fetch tasks when selected project changes
  const fetchTasks = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${selectedProject}/tasks?limit=100`);
      setTasks(data.data.tasks || []);
    } catch (err) {
      addToast("error", "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [selectedProject, addToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const byStatus = (status) => filtered.filter((t) => t.status === status);

  const canCreate = user?.role === "admin" || user?.role === "project_manager";

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tasks</h2>
          <p className="text-slate-500 mt-1">
            Global tasks view is unsupported by the backend. Select a project to view its tasks.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setCreateOpen(true)}
            disabled={!selectedProject}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </button>
        )}
      </div>

      {/* View tabs and Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 shrink-0">
        <div className="flex gap-0">
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
        <div className="pb-2">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            {projects.length === 0 ? (
              <option value="">No projects found</option>
            ) : (
              projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)
            )}
          </select>
        </div>
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

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : !selectedProject ? (
        <div className="flex-1 flex justify-center items-center text-slate-500">
          Please select a project to view tasks.
        </div>
      ) : view === "board" ? (
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
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((task) => {
                  const isOverdue = task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <tr key={task._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link to={`/app/tasks/${task._id}`} className={`font-medium group-hover:text-blue-600 transition-colors ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-900"}`}>
                          {task.title}
                        </Link>
                      </td>
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
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedProject && canCreate && (
        <CreateTaskModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          projectId={selectedProject}
          onTaskCreated={() => { addToast("success", "Task created successfully"); fetchTasks(); }}
        />
      )}
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
        {tasks.map((task) => <TaskCard key={task._id} task={task} />)}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">No tasks</div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task }) {
  const isOverdue = task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();
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
      to={`/app/tasks/${task._id}`}
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
      <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
        <div className={`flex items-center gap-1 font-medium ${isOverdue ? "text-red-600" : ""}`}>
          {task.dueDate && (
            <>
              <Calendar className="w-3.5 h-3.5" />
              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

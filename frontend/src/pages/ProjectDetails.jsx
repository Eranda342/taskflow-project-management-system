import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  Calendar,
  Users,
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  ChevronRight,
} from "lucide-react";
import { PROJECTS, USERS, getUser, getProjectTasks, formatDate, timeAgo } from "../data/mockData";
import { StatusBadge, PriorityBadge, Avatar } from "../components/Badge";
import { Modal, ConfirmDialog } from "../components/Modal";
import { useApp } from "../context/AppContext";

export function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState("overview");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState(null);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");

  const project = PROJECTS.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Project not found</h2>
        <p className="text-slate-500 mb-6">The project you are looking for does not exist.</p>
        <Link to="/app/projects" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Projects</Link>
      </div>
    );
  }

  const owner = getUser(project.ownerId);
  const [localMemberIds, setLocalMemberIds] = useState(project.memberIds);
  const [localTasks, setLocalTasks] = useState(() => getProjectTasks(project.id));
  const members = localMemberIds.map((mid) => getUser(mid)).filter(Boolean);
  const filteredTasks = localTasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase());
    const matchFilter = taskFilter === "all" || t.status === taskFilter;
    return matchSearch && matchFilter;
  });

  const ACTIVITY = [
    { id: 1, user: owner, action: "created this project", time: project.startDate + "T09:00:00Z" },
    { id: 2, user: members[1] || owner, action: "updated project status to Active", time: "2026-08-01T10:30:00Z" },
    { id: 3, user: members[0] || owner, action: "added 3 new tasks to the board", time: "2026-08-05T14:00:00Z" },
    { id: 4, user: owner, action: "set deadline to " + formatDate(project.deadline), time: "2026-08-08T09:00:00Z" },
    { id: 5, user: members[2] || owner, action: "completed task \"Setup CI/CD pipeline\"", time: "2026-08-10T16:00:00Z" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/app/projects" className="hover:text-blue-600 transition-colors">Projects</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium truncate">{project.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-slate-500 mb-4">{project.description}</p>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
              {owner && (
                <div className="flex items-center gap-2">
                  <Avatar name={owner.name} initials={owner.initials} color={owner.color} size="sm" />
                  <span>{owner.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Due {formatDate(project.deadline)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{members.length} members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-slate-400" />
                <span>{project.tasksCompleted}/{project.tasksTotal} tasks</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => addToast("info", "Edit project coming soon")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="font-semibold text-slate-900">{project.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-700"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200">
        {["overview", "tasks", "members", "activity"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab}
            {tab === "tasks" && <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{localTasks.length}</span>}
            {tab === "members" && <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{members.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "To Do", count: localTasks.filter((t) => t.status === "todo").length, color: "bg-slate-500" },
                { label: "In Progress", count: localTasks.filter((t) => t.status === "in_progress").length, color: "bg-blue-500" },
                { label: "Review", count: localTasks.filter((t) => t.status === "review").length, color: "bg-amber-500" },
                { label: "Completed", count: localTasks.filter((t) => t.status === "completed").length, color: "bg-green-500" },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color} mb-3`} />
                  <div className="text-2xl font-bold text-slate-900">{item.count}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Tasks</h3>
              <div className="space-y-3">
                {localTasks.slice(0, 5).map((task) => {
                  const assignee = getUser(task.assigneeId);
                  return (
                    <Link
                      key={task.id}
                      to={`/app/tasks/${task.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">{task.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{formatDate(task.dueDate)}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                        {assignee && <Avatar name={assignee.name} initials={assignee.initials} color={assignee.color} size="sm" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
              <button onClick={() => setActiveTab("tasks")} className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">
                View all tasks →
              </button>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Project Details</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs font-medium mb-0.5">Status</dt>
                  <dd><StatusBadge status={project.status} /></dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs font-medium mb-0.5">Start Date</dt>
                  <dd className="font-medium text-slate-900">{formatDate(project.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs font-medium mb-0.5">Deadline</dt>
                  <dd className="font-medium text-slate-900">{formatDate(project.deadline)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs font-medium mb-0.5">Owner</dt>
                  {owner && (
                    <dd className="flex items-center gap-2">
                      <Avatar name={owner.name} initials={owner.initials} color={owner.color} size="sm" />
                      <span className="font-medium text-slate-900">{owner.name}</span>
                    </dd>
                  )}
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Team Members</h3>
              <div className="space-y-3">
                {members.slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar name={m.name} initials={m.initials} color={m.color} size="sm" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.role === "project_manager" ? "Project Manager" : "Team Member"}</div>
                    </div>
                  </div>
                ))}
                {members.length > 4 && (
                  <button onClick={() => setActiveTab("members")} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                    +{members.length - 4} more
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between bg-slate-50/50">
            <div className="flex gap-3 flex-1">
              <input
                type="text"
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="pl-3 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
              />
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button
              onClick={() => setCreateTaskOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Task</th>
                  <th className="px-6 py-3 font-medium">Assignee</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const assignee = getUser(task.assigneeId);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link to={`/app/tasks/${task.id}`} className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {assignee && (
                          <div className="flex items-center gap-2">
                            <Avatar name={assignee.name} initials={assignee.initials} color={assignee.color} size="sm" />
                            <span className="text-slate-700">{assignee.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={task.status} /></td>
                      <td className="px-6 py-4"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(task.dueDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">No tasks found.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "members" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">{localMemberIds.length} Members</h3>
            <button
              onClick={() => setAddMemberOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                <Avatar name={member.name} initials={member.initials} color={member.color} size="md" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{member.name}</div>
                  <div className="text-xs text-slate-500">{member.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                    member.role === "project_manager" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}>
                    {member.role === "project_manager" ? "Manager" : "Member"}
                  </span>
                  {member.id !== project.ownerId && (
                    <button
                      onClick={() => setRemoveMemberConfirm(member.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Project Activity</h3>
          <div className="space-y-6">
            {ACTIVITY.map((item) => (
              <div key={item.id} className="flex gap-4">
                {item.user && (
                  <Avatar name={item.user.name} initials={item.user.initials} color={item.user.color} size="sm" />
                )}
                <div>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{item.user?.name}</span>{" "}
                    {item.action}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{timeAgo(item.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projectId={project.id}
        onTaskCreated={(t) => setLocalTasks((prev) => [...prev, t])}
      />
      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        existingIds={localMemberIds}
        onMemberAdded={(uid) => setLocalMemberIds((prev) => [...prev, uid])}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { addToast("success", "Project deleted"); navigate("/app/projects"); }}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete Project"
        danger
      />
      <ConfirmDialog
        open={!!removeMemberConfirm}
        onClose={() => setRemoveMemberConfirm(null)}
        onConfirm={() => {
          if (removeMemberConfirm) {
            setLocalMemberIds((prev) => prev.filter((mid) => mid !== removeMemberConfirm));
            addToast("success", "Member removed from project");
          }
          setRemoveMemberConfirm(null);
        }}
        title="Remove Member"
        description="Are you sure you want to remove this member from the project?"
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}

function CreateTaskModal({ open, onClose, projectId, onTaskCreated }) {
  const { addToast } = useApp();
  const [form, setForm] = useState({ title: "", description: "", assignee: "", priority: "medium", dueDate: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const newTask = {
      id: `lt-${Date.now()}`,
      projectId,
      title: form.title,
      description: form.description,
      status: "todo",
      priority: form.priority,
      assigneeId: form.assignee || "u1",
      createdById: "u1",
      dueDate: form.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commentsCount: 0,
    };
    onTaskCreated(newTask);
    addToast("success", "Task created successfully");
    onClose();
    setForm({ title: "", description: "", assignee: "", priority: "medium", dueDate: "" });
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
            placeholder="Add a description..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assignee</label>
            <select
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3 pt-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddMemberModal({ open, onClose, existingIds, onMemberAdded }) {
  const { addToast } = useApp();
  const [search, setSearch] = useState("");
  const available = USERS.filter(
    (u) => !existingIds.includes(u.id) && u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal open={open} onClose={onClose} title="Add Member">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {available.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No users found</p>
          ) : (
            available.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${u.color} flex items-center justify-center text-white text-xs font-semibold`}>{u.initials}</div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onMemberAdded(u.id);
                    addToast("success", `${u.name} added to project`);
                    onClose();
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

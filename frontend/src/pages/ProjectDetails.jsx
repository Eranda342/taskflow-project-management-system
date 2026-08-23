import { useState, useEffect, useCallback } from "react";
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
import { StatusBadge, PriorityBadge, Avatar } from "../components/Badge";
import { Modal, ConfirmDialog } from "../components/Modal";
import CreateTaskModal from "../components/CreateTaskModal";
import { useApp } from "../context/AppContext";
import api from "../lib/api";
import { getSocket } from "../lib/socket";

function formatDate(dateString) {
  if (!dateString) return "No date";
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(dateString) {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast, user: currentUser } = useApp();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "", deadline: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState(null);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`)
      ]);

      if (projRes.data.success) {
        setProject(projRes.data.data.project);
      } else {
        throw new Error(projRes.data.message || "Failed to load project");
      }

      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data.tasks);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error loading project";
      setError(msg);
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !id) return;

    socket.emit("project:join", { projectId: id });

    const handleTaskCreated = (data) => {
      const taskProjectId = data.task?.project?._id || data.task?.project;
      if (data.task && taskProjectId === id) {
        setTasks((prev) => [data.task, ...prev]);
      }
    };

    const handleTaskUpdated = (data) => {
      const taskProjectId = data.task?.project?._id || data.task?.project;
      if (data.task && taskProjectId === id) {
        setTasks((prev) => prev.map(t => t._id === data.task._id ? data.task : t));
      }
    };

    const handleTaskDeleted = (data) => {
      if (data.projectId === id) {
        setTasks((prev) => prev.filter(t => t._id !== data.taskId));
      }
    };

    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:deleted", handleTaskDeleted);

    return () => {
      socket.emit("project:leave", { projectId: id });
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:deleted", handleTaskDeleted);
    };
  }, [id, setTasks]);

  const handleDeleteProject = async () => {
    try {
      const res = await api.delete(`/projects/${id}`);
      if (res.data.success) {
        addToast("success", "Project deleted");
        navigate("/app/projects");
      } else {
        throw new Error(res.data.message || "Failed to delete project");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error deleting project";
      addToast("error", msg);
    }
  };

  const handleOpenEdit = () => {
    setEditForm({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "planning",
      deadline: project.deadline ? project.deadline.slice(0, 10) : "",
    });
    setEditOpen(true);
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      addToast("error", "Project name is required");
      return;
    }
    setEditLoading(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        status: editForm.status,
      };
      if (editForm.deadline) payload.deadline = editForm.deadline;
      const res = await api.patch(`/projects/${id}`, payload);
      if (res.data.success) {
        setProject(res.data.data.project);
        addToast("success", "Project updated successfully");
        setEditOpen(false);
      } else {
        throw new Error(res.data.message || "Failed to update project");
      }
    } catch (err) {
      addToast("error", err.response?.data?.message || err.message || "Error updating project");
    } finally {
      setEditLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const res = await api.delete(`/projects/${id}/members/${userId}`);
      if (res.data.success) {
        addToast("success", "Member removed from project");
        setProject(prev => ({
          ...prev,
          members: prev.members.filter(m => m.user?._id !== userId)
        }));
      } else {
        throw new Error(res.data.message || "Failed to remove member");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error removing member";
      addToast("error", msg);
    } finally {
      setRemoveMemberConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Project Error</h2>
        <p className="text-slate-500 mb-6">{error || "The project you are looking for does not exist."}</p>
        <Link to="/app/projects" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Projects</Link>
      </div>
    );
  }

  const owner = project.owner;
  const members = project.members || [];
  
  const filteredTasks = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase());
    const matchFilter = taskFilter === "all" || t.status === taskFilter;
    return matchSearch && matchFilter;
  });

  const tasksTotal = tasks.length;
  const tasksCompleted = tasks.filter((t) => t.status === "completed").length;
  const progress = tasksTotal === 0 ? 0 : Math.round((tasksCompleted / tasksTotal) * 100);

  const canManageMembers = currentUser.role === "admin" || currentUser.role === "project_manager";
  const canManageProject = currentUser.role === "admin" || (currentUser.role === "project_manager" && (owner?._id === currentUser.id || owner?._id === currentUser._id));

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
                  {owner.profileImage ? (
                    <img src={owner.profileImage} alt={owner.name} className="w-5 h-5 rounded-full" />
                  ) : (
                    <Avatar name={owner.name} initials={owner.name?.[0]} color="bg-blue-100 text-blue-700" size="sm" />
                  )}
                  <span className="flex items-center gap-1.5">
                    {owner.name}
                    {owner.role === 'project_manager' && (
                      <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded leading-none">PM</span>
                    )}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Due {project.deadline ? formatDate(project.deadline) : "None"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{members.length} members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-slate-400" />
                <span>{tasksCompleted}/{tasksTotal} tasks</span>
              </div>
            </div>
          </div>
          {canManageProject && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleOpenEdit}
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
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="font-semibold text-slate-900">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
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
            {tab === "tasks" && <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{tasksTotal}</span>}
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
                { label: "To Do", count: tasks.filter((t) => t.status === "todo").length, color: "bg-slate-500" },
                { label: "In Progress", count: tasks.filter((t) => t.status === "in_progress").length, color: "bg-blue-500" },
                { label: "Review", count: tasks.filter((t) => t.status === "review").length, color: "bg-amber-500" },
                { label: "Completed", count: tasksCompleted, color: "bg-green-500" },
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
                {tasks.slice(0, 5).map((task) => {
                  const assignee = task.assignedTo;
                  return (
                    <Link
                      key={task._id}
                      to={`/app/tasks/${task._id}`}
                      className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">{task.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{task.dueDate ? formatDate(task.dueDate) : "No due date"}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                        {assignee && (
                          assignee.profileImage ? (
                            <img src={assignee.profileImage} alt={assignee.name} className="w-6 h-6 rounded-full" />
                          ) : (
                            <Avatar name={assignee.name} initials={assignee.name?.[0]} color="bg-blue-100 text-blue-700" size="sm" />
                          )
                        )}
                      </div>
                    </Link>
                  );
                })}
                {tasks.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-4">No tasks found in this project.</div>
                )}
              </div>
              {tasks.length > 5 && (
                <button onClick={() => setActiveTab("tasks")} className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">
                  View all tasks →
                </button>
              )}
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
                  <dd className="font-medium text-slate-900">{project.startDate ? formatDate(project.startDate) : "None"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs font-medium mb-0.5">Deadline</dt>
                  <dd className="font-medium text-slate-900">{project.deadline ? formatDate(project.deadline) : "None"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs font-medium mb-0.5">Owner</dt>
                  {owner && (
                    <dd className="flex items-center gap-2">
                      {owner.profileImage ? (
                        <img src={owner.profileImage} alt={owner.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <Avatar name={owner.name} initials={owner.name?.[0]} color="bg-blue-100 text-blue-700" size="sm" />
                      )}
                      <span className="font-medium text-slate-900 flex items-center gap-1.5">
                        {owner.name}
                        {owner.role === 'project_manager' && (
                          <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded leading-none">PM</span>
                        )}
                      </span>
                    </dd>
                  )}
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Team Members</h3>
              <div className="space-y-3">
                {members.slice(0, 4).map((m) => (
                  <div key={m.user?._id} className="flex items-center gap-3">
                    {m.user?.profileImage ? (
                      <img src={m.user?.profileImage} alt={m.user?.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <Avatar name={m.user?.name} initials={m.user?.name?.[0]} color="bg-slate-100 text-slate-700" size="sm" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-900">{m.user?.name}</div>
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
            {canManageProject && (
              <button
                onClick={() => setCreateTaskOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
            )}
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
                  const assignee = task.assignedTo;
                  return (
                    <tr key={task._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link to={`/app/tasks/${task._id}`} className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            {assignee.profileImage ? (
                              <img src={assignee.profileImage} alt={assignee.name} className="w-6 h-6 rounded-full" />
                            ) : (
                              <Avatar name={assignee.name} initials={assignee.name?.[0]} color="bg-slate-100 text-slate-700" size="sm" />
                            )}
                            <span className="text-slate-700 flex items-center gap-1.5">
                              {assignee.name}
                              {assignee.role === 'project_manager' && (
                                <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded leading-none">PM</span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={task.status} /></td>
                      <td className="px-6 py-4"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-6 py-4 text-slate-600">{task.dueDate ? formatDate(task.dueDate) : "None"}</td>
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
            <h3 className="text-base font-semibold text-slate-900">{members.length} Members</h3>
            {canManageMembers && (
              <button
                onClick={() => setAddMemberOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {members.map((member) => (
              <div key={member.user?._id} className="flex items-center gap-4 px-6 py-4">
                {member.user?.profileImage ? (
                  <img src={member.user?.profileImage} alt={member.user?.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <Avatar name={member.user?.name} initials={member.user?.name?.[0]} color="bg-slate-100 text-slate-700" size="md" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{member.user?.name}</div>
                  <div className="text-xs text-slate-500">{member.user?.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                    member.role === "admin" || member.role === "project_manager" 
                      ? "bg-blue-50 text-blue-700 border-blue-200" 
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}>
                    {member.role === "admin" ? "Admin" : member.role === "project_manager" ? "Manager" : "Member"}
                  </span>
                  {canManageMembers && member.user?._id !== owner?._id && (
                    <button
                      onClick={() => setRemoveMemberConfirm(member.user?._id)}
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <h3 className="text-base font-semibold text-slate-900 mb-2">Project Activity</h3>
          <p className="text-sm text-slate-500">Activity feed is not currently tracked by the backend API.</p>
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projectId={project._id}
        members={members}
        onTaskCreated={(t) => { setTasks((prev) => [...prev, t]); addToast("success", "Task created successfully"); }}
      />
      
      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        projectId={project._id}
        onMemberAdded={(newMembers) => setProject(prev => ({ ...prev, members: newMembers }))}
      />
      
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete Project"
        danger
      />
      
      <ConfirmDialog
        open={!!removeMemberConfirm}
        onClose={() => setRemoveMemberConfirm(null)}
        onConfirm={() => handleRemoveMember(removeMemberConfirm)}
        title="Remove Member"
        description="Are you sure you want to remove this member from the project? They will be unassigned from all tasks in this project."
        confirmLabel="Remove"
        danger
      />

      {/* Edit Project Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Project">
        <form onSubmit={handleEditProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
              maxLength={150}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
              <input
                type="date"
                value={editForm.deadline}
                onChange={(e) => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              disabled={editLoading}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {editLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function AddMemberModal({ open, onClose, projectId, onMemberAdded }) {
  const { addToast } = useApp();
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setCandidates([]);
      return;
    }
    
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append("search", search);
        
        const res = await api.get(`/projects/${projectId}/member-candidates?${queryParams.toString()}`);
        if (res.data.success) {
          setCandidates(res.data.data.users);
        }
      } catch (err) {
        console.error("Failed to fetch candidates", err);
      } finally {
        setLoading(false);
      }
    };
    
    // Add a small debounce
    const timeout = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(timeout);
  }, [open, search, projectId]);

  const handleAddMember = async (userId, userName) => {
    setAddLoading(userId);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { userId });
      if (res.data.success) {
        addToast("success", `${userName} added to project`);
        onMemberAdded(res.data.data.members); // The API returns the updated members array
        onClose();
      } else {
        throw new Error(res.data.message || "Failed to add member");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error adding member";
      addToast("error", msg);
    } finally {
      setAddLoading(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Member">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              {search ? "No matching users found" : "Type to search for eligible members"}
            </p>
          ) : (
            candidates.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  {u.profileImage ? (
                    <img src={u.profileImage} alt={u.user?.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <Avatar name={u.user?.name} initials={u.user?.name?.[0]} color="bg-slate-100 text-slate-700" size="sm" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-slate-900">{u.user?.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleAddMember(u.id, u.user?.name)}
                  disabled={addLoading === u.id}
                  className="inline-flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-50 w-16"
                >
                  {addLoading === u.id ? <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : "Add"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}


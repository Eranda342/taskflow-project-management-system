import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ChevronRight,
  User,
  MessageSquare,
  Send,
  Edit2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import { StatusBadge, PriorityBadge, Avatar } from "../components/Badge";
import { Modal, ConfirmDialog } from "../components/Modal";
import { useApp } from "../context/AppContext";

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(dateString) {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast, user: authUser } = useApp();
  
  const currentUser = authUser ? {
    id: authUser.id || authUser._id,
    name: authUser.name,
    initials: authUser.name ? authUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U",
    color: "bg-blue-600"
  } : { id: "u1", name: "Unknown", initials: "U", color: "bg-slate-400" };

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [assignOpen, setAssignOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState(null);

  const fetchTaskAndComments = async () => {
    try {
      const [{ data: taskData }, { data: commentsData }] = await Promise.all([
        api.get(`/tasks/${id}`),
        api.get(`/tasks/${id}/comments`).catch(() => ({ data: { data: { comments: [] } } }))
      ]);
      setTask(taskData.data.task);
      setComments(commentsData.data.comments || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setTask(null);
      } else {
        addToast("error", "Failed to load task details");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskAndComments();
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !task?._id) return;

    const handleTaskUpdated = (data) => {
      if (data.task && data.task._id === task._id) {
        setTask(data.task);
      }
    };
    
    socket.on("task:updated", handleTaskUpdated);
    
    return () => {
      socket.off("task:updated", handleTaskUpdated);
    };
  }, [task?._id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-blue-600">
        <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Task not found</h2>
        <Link to="/app/tasks" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Tasks</Link>
      </div>
    );
  }

  const project = task.project;
  const assignee = task.assignedTo;
  const createdBy = task.createdBy;
  const currentStatus = task.status;
  const currentPriority = task.priority;

  const isOverdue = currentStatus !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();

  // Mutations
  const updateStatus = async (status) => {
    try {
      const { data } = await api.patch(`/tasks/${task._id}/status`, { status });
      setTask(data.data.task);
      addToast("success", "Status updated");
    } catch (err) {
      addToast("error", err.response?.data?.message || "Failed to update status");
    }
  };

  const updatePriority = async (priority) => {
    try {
      const { data } = await api.patch(`/tasks/${task._id}`, { priority });
      setTask(data.data.task);
      addToast("success", "Priority updated");
    } catch (err) {
      addToast("error", err.response?.data?.message || "Failed to update priority");
    }
  };

  const handleDeleteTask = async () => {
    try {
      await api.delete(`/tasks/${task._id}`);
      addToast("success", "Task deleted");
      navigate(project ? `/app/projects/${project._id}` : "/app/tasks");
    } catch (err) {
      addToast("error", err.response?.data?.message || "Failed to delete task");
    }
    setDeleteOpen(false);
  };

  const loadProjectMembers = async () => {
    if (!project) return;
    try {
      const { data } = await api.get(`/projects/${project._id}/members`);
      setProjectMembers(data.data.members || []);
      setSelectedAssignee(assignee ? assignee._id : "");
      setAssignError(null);
      setAssignOpen(true);
    } catch (err) {
      addToast("error", "Failed to load project members");
    }
  };

  const handleAssign = async () => {
    setAssignLoading(true);
    setAssignError(null);
    try {
      const { data } = await api.patch(`/tasks/${task._id}/assign`, { userId: selectedAssignee || null });
      setTask(data.data.task);
      addToast("success", "Assignee updated");
      setAssignOpen(false);
    } catch (err) {
      setAssignError(err.response?.data?.message || "Failed to update assignee");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/tasks/${task._id}/comments`, { message: newComment });
      setComments((prev) => [...prev, data.data.comment]);
      setNewComment("");
      addToast("success", "Comment added");
    } catch (err) {
      addToast("error", err.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (commentId) => {
    try {
      const { data } = await api.patch(`/comments/${commentId}`, { message: editCommentText });
      setComments((prev) => prev.map((c) => (c._id === commentId ? data.data.comment : c)));
      setEditingCommentId(null);
      addToast("success", "Comment updated");
    } catch (err) {
      addToast("error", err.response?.data?.message || "Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      addToast("success", "Comment deleted");
    } catch (err) {
      addToast("error", "Failed to delete comment");
    }
    setDeleteCommentId(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
        {project && (
          <>
            <Link to="/app/projects" className="hover:text-blue-600 transition-colors">Projects</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/app/projects/${project._id}`} className="hover:text-blue-600 transition-colors">{project.name}</Link>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span className="text-slate-900 font-medium truncate">{task.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task header */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <StatusBadge status={currentStatus} />
                  <PriorityBadge priority={currentPriority} />
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Overdue
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-slate-900">{task.title}</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{task.description || "No description provided."}</p>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Update Task</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Status</label>
                <select
                  value={currentStatus}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={!(authUser?.role === "admin" || authUser?.role === "project_manager" || (assignee && (assignee._id === currentUser.id || assignee.id === currentUser.id)))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Priority</label>
                <select
                  value={currentPriority}
                  onChange={(e) => updatePriority(e.target.value)}
                  disabled={!(authUser?.role === "admin" || authUser?.role === "project_manager")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Comments ({comments.length})
              </h3>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {comments.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  No comments yet. Be the first to comment.
                </div>
              ) : (
                comments.map((comment) => {
                  const author = comment.user || comment.author;
                  const isEditing = editingCommentId === comment._id;
                  const authorInitials = author?.name ? author.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";
                  return (
                    <div key={comment._id} className="p-6">
                      <div className="flex items-start gap-3">
                        <Avatar name={author?.name} initials={authorInitials} color="bg-slate-400" size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                {author?.name ?? "Unknown"}
                                {author?.role === 'project_manager' && (
                                  <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded leading-none">PM</span>
                                )}
                              </span>
                              <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
                            </div>
                            {(currentUser.id === author?._id || authUser?.role === "admin") && (
                              <div className="flex items-center gap-1">
                                {currentUser.id === author?._id && (
                                  <button
                                    onClick={() => { setEditingCommentId(comment._id); setEditCommentText(comment.message); }}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeleteCommentId(comment._id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveEdit(comment._id)}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add comment */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <form onSubmit={handleSubmitComment} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full ${currentUser.color} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>{currentUser.initials}</div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setNewComment("")}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !newComment.trim()}
                      className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Comment
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Task Details</h3>

            <DetailRow label="Status"><StatusBadge status={currentStatus} /></DetailRow>
            <DetailRow label="Priority"><PriorityBadge priority={currentPriority} /></DetailRow>
            <DetailRow label="Project">
              {project ? (
                <Link to={`/app/projects/${project._id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  {project.name}
                </Link>
              ) : (
                <span className="text-sm text-slate-500">—</span>
              )}
            </DetailRow>
            <DetailRow label="Assignee">
              {assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar name={assignee.name} initials={assignee.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)} color="bg-slate-400" size="sm" />
                  <span className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                    {assignee.name}
                    {assignee.role === 'project_manager' && (
                      <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded leading-none">PM</span>
                    )}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-slate-500">Unassigned</span>
              )}
            </DetailRow>
            <DetailRow label="Created by">
              {createdBy ? (
                <div className="flex items-center gap-2">
                  <Avatar name={createdBy.name} initials={createdBy.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)} color="bg-slate-400" size="sm" />
                  <span className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                    {createdBy.name}
                    {createdBy.role === 'project_manager' && (
                      <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded leading-none">PM</span>
                    )}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-slate-500">—</span>
              )}
            </DetailRow>
            <DetailRow label="Due Date">
              <span className={`text-sm font-medium ${isOverdue ? "text-red-600" : "text-slate-900"}`}>
                {formatDate(task.dueDate)}
              </span>
            </DetailRow>
            <DetailRow label="Created">
              <span className="text-sm text-slate-600">{formatDate(task.createdAt)}</span>
            </DetailRow>
            <DetailRow label="Updated">
              <span className="text-sm text-slate-600">{timeAgo(task.updatedAt)}</span>
            </DetailRow>
          </div>

          {(authUser?.role === "admin" || authUser?.role === "project_manager") && (
            <button
              onClick={loadProjectMembers}
              className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              Change Assignee
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
        confirmLabel="Delete Task"
        danger
      />
      <ConfirmDialog
        open={!!deleteCommentId}
        onClose={() => setDeleteCommentId(null)}
        onConfirm={() => handleDeleteComment(deleteCommentId)}
        title="Delete Comment"
        description="Are you sure you want to delete this comment?"
        confirmLabel="Delete"
        danger
      />
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Change Assignee" size="md">
        <div className="space-y-4">
          {assignError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {assignError}
            </div>
          )}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            <div
              onClick={() => setSelectedAssignee("")}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                !selectedAssignee ? "border-blue-600 bg-blue-50" : "border-slate-100 hover:border-blue-200"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">Unassigned</div>
                <div className="text-xs text-slate-500">Remove current assignee</div>
              </div>
            </div>

            {projectMembers.map((m) => {
              const u = m.user || m;
              if (!u) return null;
              const userId = u._id || u.id;
              const isSelected = selectedAssignee === userId;
              return (
                <div
                  key={userId}
                  onClick={() => setSelectedAssignee(userId)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected ? "border-blue-600 bg-blue-50" : "border-slate-100 hover:border-blue-200"
                  }`}
                >
                  {u.profileImage ? (
                    <img src={u.profileImage} alt={u.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <Avatar name={u.name} initials={u.name?.[0]} color="bg-slate-200 text-slate-700" size="sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 flex items-center gap-2 truncate">
                      {u.name}
                      {u.role === 'project_manager' && (
                        <span className="shrink-0 text-[10px] uppercase font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded leading-none">
                          PM
                        </span>
                      )}
                      {assignee && (assignee._id === userId || assignee.id === userId) && (
                        <span className="shrink-0 text-[10px] uppercase font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setAssignOpen(false)}
              disabled={assignLoading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={assignLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {assignLoading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {selectedAssignee ? "Assign" : "Unassign"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 mb-1">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

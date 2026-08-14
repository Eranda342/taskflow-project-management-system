import { useState } from "react";
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
import { TASKS, getUser, getProject, getTaskComments, formatDate, timeAgo } from "../data/mockData";
import { StatusBadge, PriorityBadge, Avatar } from "../components/Badge";
import { ConfirmDialog } from "../components/Modal";
import { useApp } from "../context/AppContext";

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

  const task = TASKS.find((t) => t.id === id);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Unified comment list: seeded from mock data, all mutations applied here
  const [comments, setComments] = useState(() => task ? getTaskComments(task.id) : []);
  const [statusOverride, setStatusOverride] = useState(null);
  const [priorityOverride, setPriorityOverride] = useState(null);

  if (!task) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Task not found</h2>
        <Link to="/app/tasks" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Tasks</Link>
      </div>
    );
  }

  const project = getProject(task.projectId);
  const assignee = getUser(task.assigneeId);
  const createdBy = getUser(task.createdById);
  const currentStatus = statusOverride ?? task.status;
  const currentPriority = priorityOverride ?? task.priority;

  const isOverdue = currentStatus !== "completed" && new Date(task.dueDate) < new Date("2026-08-12");

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const comment = {
        id: `lc-${Date.now()}`,
        taskId: task.id,
        authorId: currentUser.id,
        content: newComment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      setSubmitting(false);
      addToast("success", "Comment added");
    }, 600);
  };

  const handleSaveEdit = (commentId) => {
    setComments((prev) => prev.map((c) =>
      c.id === commentId ? { ...c, content: editCommentText, updatedAt: new Date().toISOString() } : c
    ));
    setEditingCommentId(null);
    addToast("success", "Comment updated");
  };

  const handleDeleteComment = (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setDeleteCommentId(null);
    addToast("success", "Comment deleted");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
        {project && (
          <>
            <Link to="/app/projects" className="hover:text-blue-600 transition-colors">Projects</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/app/projects/${project.id}`} className="hover:text-blue-600 transition-colors">{project.name}</Link>
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
                  onClick={() => addToast("info", "Edit task coming soon")}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Update Task</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Status</label>
                <select
                  value={currentStatus}
                  onChange={(e) => { setStatusOverride(e.target.value); addToast("success", "Status updated"); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  onChange={(e) => { setPriorityOverride(e.target.value); addToast("success", "Priority updated"); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="divide-y divide-slate-100">
              {comments.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  No comments yet. Be the first to comment.
                </div>
              ) : (
                comments.map((comment) => {
                  const author = getUser(comment.authorId);
                  const isEditing = editingCommentId === comment.id;
                  return (
                    <div key={comment.id} className="p-6">
                      <div className="flex items-start gap-3">
                        {author && <Avatar name={author.name} initials={author.initials} color={author.color} size="sm" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">{author?.name ?? "Unknown"}</span>
                              <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content); }}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteCommentId(comment.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
                                  onClick={() => handleSaveEdit(comment.id)}
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
                            <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
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
                <Link to={`/app/projects/${project.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  {project.name}
                </Link>
              ) : (
                <span className="text-sm text-slate-500">—</span>
              )}
            </DetailRow>
            <DetailRow label="Assignee">
              {assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar name={assignee.name} initials={assignee.initials} color={assignee.color} size="sm" />
                  <span className="text-sm font-medium text-slate-900">{assignee.name}</span>
                </div>
              ) : (
                <span className="text-sm text-slate-500">Unassigned</span>
              )}
            </DetailRow>
            <DetailRow label="Created by">
              {createdBy ? (
                <div className="flex items-center gap-2">
                  <Avatar name={createdBy.name} initials={createdBy.initials} color={createdBy.color} size="sm" />
                  <span className="text-sm font-medium text-slate-900">{createdBy.name}</span>
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

          <button
            onClick={() => addToast("success", `Task assigned to ${assignee?.name ?? "team member"}`)}
            className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Change Assignee
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { addToast("success", "Task deleted"); navigate(project ? `/app/projects/${project.id}` : "/app/tasks"); }}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
        confirmLabel="Delete Task"
        danger
      />
      <ConfirmDialog
        open={!!deleteCommentId}
        onClose={() => setDeleteCommentId(null)}
        onConfirm={() => { if (deleteCommentId) handleDeleteComment(deleteCommentId); }}
        title="Delete Comment"
        description="Are you sure you want to delete this comment?"
        confirmLabel="Delete"
        danger
      />
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

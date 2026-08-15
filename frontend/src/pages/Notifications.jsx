import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Bell, CheckCheck, Tag, FolderOpen, MessageSquare, UserPlus, UserMinus, Settings } from "lucide-react";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

const NOTIF_ICONS = {
  task_assigned: <Tag className="w-4 h-4" />,
  task_status_updated: <Settings className="w-4 h-4" />,
  comment_added: <MessageSquare className="w-4 h-4" />,
  project_member_added: <UserPlus className="w-4 h-4" />,
  project_member_removed: <UserMinus className="w-4 h-4" />,
  project_ownership_transferred: <FolderOpen className="w-4 h-4" />,
};

const NOTIF_COLORS = {
  task_assigned: "bg-blue-50 text-blue-600 border-blue-100",
  task_status_updated: "bg-amber-50 text-amber-600 border-amber-100",
  comment_added: "bg-violet-50 text-violet-600 border-violet-100",
  project_member_added: "bg-emerald-50 text-emerald-600 border-emerald-100",
  project_member_removed: "bg-red-50 text-red-600 border-red-100",
  project_ownership_transferred: "bg-slate-50 text-slate-600 border-slate-200",
};

function timeAgo(dateString) {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function Notifications() {
  const { setUnreadCount, addToast } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/notifications?limit=100");
      if (data.success && data.data) {
        setNotifications(data.data.notifications || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications");
      addToast("error", "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unread = notifications.filter((n) => !n.read);
  const displayed = filter === "unread" ? unread : notifications;

  const markRead = async (id) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      addToast("error", err.response?.data?.message || "Failed to mark as read");
    } finally {
      setActionLoading(false);
    }
  };

  const markAllRead = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const { data } = await api.patch("/notifications/read-all");
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        addToast("success", "All notifications marked as read");
      }
    } catch (err) {
      addToast("error", err.response?.data?.message || "Failed to mark all as read");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to figure out the route link based on referenceId and type
  const getTargetLink = (n) => {
    if (!n.referenceId) return "#";
    const type = n.type;
    if (type === "task_assigned" || type === "task_status_updated" || type === "comment_added") {
      return `/app/tasks/${n.referenceId}`;
    }
    if (type === "project_member_added" || type === "project_member_removed" || type === "project_ownership_transferred") {
      return `/app/projects/${n.referenceId}`;
    }
    return "#";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={fetchNotifications} className="text-blue-600 hover:text-blue-700 font-medium">Try Again</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h2>
          <p className="text-slate-500 mt-1">
            {unread.length > 0 ? `${unread.length} unread notification${unread.length > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {["all", "unread"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {f === "all" ? `All (${notifications.length})` : `Unread (${unread.length})`}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No notifications</h3>
            <p className="text-sm text-slate-500">
              {filter === "unread" ? "You have no unread notifications." : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayed.map((notif) => (
              <div
                key={notif._id}
                className={`flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50 ${!notif.read ? "bg-blue-50/30" : ""}`}
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${NOTIF_COLORS[notif.type] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                  {NOTIF_ICONS[notif.type] || <Bell className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  {notif.referenceId ? (
                    <Link
                      to={getTargetLink(notif)}
                      onClick={(e) => {
                        if (!notif.read) markRead(notif._id);
                      }}
                      className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors leading-relaxed"
                    >
                      {notif.message}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-slate-900 leading-relaxed">
                      {notif.message}
                    </span>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                  {!notif.read && (
                    <button
                      onClick={() => markRead(notif._id)}
                      disabled={actionLoading}
                      className="text-xs font-medium text-slate-500 hover:text-blue-600 whitespace-nowrap transition-colors disabled:opacity-50"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

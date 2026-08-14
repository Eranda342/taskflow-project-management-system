import { useState } from "react";
import { Link } from "react-router";
import { Bell, CheckCheck, Tag, FolderOpen, MessageSquare, UserPlus, UserMinus, Settings } from "lucide-react";
import { NOTIFICATIONS, timeAgo } from "../data/mockData";
import { useApp } from "../context/AppContext";

const NOTIF_ICONS = {
  task_assigned: <Tag className="w-4 h-4" />,
  task_updated: <Settings className="w-4 h-4" />,
  comment_added: <MessageSquare className="w-4 h-4" />,
  member_added: <UserPlus className="w-4 h-4" />,
  member_removed: <UserMinus className="w-4 h-4" />,
  project_updated: <FolderOpen className="w-4 h-4" />,
};

const NOTIF_COLORS = {
  task_assigned: "bg-blue-50 text-blue-600 border-blue-100",
  task_updated: "bg-amber-50 text-amber-600 border-amber-100",
  comment_added: "bg-violet-50 text-violet-600 border-violet-100",
  member_added: "bg-emerald-50 text-emerald-600 border-emerald-100",
  member_removed: "bg-red-50 text-red-600 border-red-100",
  project_updated: "bg-slate-50 text-slate-600 border-slate-200",
};

export function Notifications() {
  const { setUnreadCount, addToast } = useApp();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState("all");

  const unread = notifications.filter((n) => !n.isRead);
  const displayed = filter === "unread" ? unread : notifications;

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount(notifications.filter((n) => !n.isRead && n.id !== id).length);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    addToast("success", "All notifications marked as read");
  };

  const getTargetLink = (n) => {
    if (n.targetType === "task") return `/app/tasks/${n.targetId}`;
    return `/app/projects/${n.targetId}`;
  };

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
                key={notif.id}
                className={`flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50 ${!notif.isRead ? "bg-blue-50/30" : ""}`}
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${NOTIF_COLORS[notif.type]}`}>
                  {NOTIF_ICONS[notif.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={getTargetLink(notif)}
                    onClick={() => markRead(notif.id)}
                    className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors leading-relaxed"
                  >
                    {notif.message}
                  </Link>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                  {!notif.isRead && (
                    <button
                      onClick={() => markRead(notif.id)}
                      className="text-xs font-medium text-slate-500 hover:text-blue-600 whitespace-nowrap transition-colors"
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

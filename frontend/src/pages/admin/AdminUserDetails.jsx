import { useParams, Link } from "react-router";
import { ChevronRight, Shield, UserCheck, UserX } from "lucide-react";
import { Avatar } from "../../components/Badge";
import { useApp } from "../../context/AppContext";
import { useState, useEffect, useCallback } from "react";
import { ConfirmDialog } from "../../components/Modal";
import api from "../../lib/api";

const ROLE_LABELS = {
  admin: "Admin",
  project_manager: "Project Manager",
  team_member: "Team Member",
};

export function AdminUserDetails() {
  const { userId } = useParams();
  const { addToast } = useApp();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmRole, setConfirmRole] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}/summary`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      addToast("error", error.response?.data?.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  }, [userId, addToast]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const toggleStatus = async () => {
    if (!data?.user) return;
    const user = data.user;
    const newStatus = user.status === "active" ? "inactive" : "active";
    
    if (newStatus === "inactive" && !data.canDeactivate) {
      addToast("error", data.deactivationBlockReason || "Cannot deactivate user");
      setConfirmDeactivate(false);
      return;
    }

    setActionLoading(true);
    try {
      await api.patch(`/users/${user.id}/status`, { status: newStatus });
      addToast("success", `${user.name} has been ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchSummary();
    } catch (error) {
      addToast("error", error.response?.data?.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
      setConfirmDeactivate(false);
    }
  };

  const changeRole = async (role) => {
    if (!data?.user) return;
    setActionLoading(true);
    try {
      await api.patch(`/users/${data.user.id}/role`, { role });
      addToast("success", "User role updated successfully");
      fetchSummary();
    } catch (error) {
      addToast("error", error.response?.data?.message || "Failed to update user role");
    } finally {
      setActionLoading(false);
      setConfirmRole(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-500">Loading user details...</p>
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">User not found</h2>
        <Link to="/app/admin/users" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Users</Link>
      </div>
    );
  }

  const { user, projects, tasks, comments, notifications } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/app/admin/users" className="hover:text-blue-600 transition-colors">Users</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium">{user.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile card */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
            <Avatar name={user.name} initials={user.profileImage ? null : undefined} color="bg-blue-600" size="lg" />
            <h2 className="text-lg font-bold text-slate-900 mt-3">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                user.role === "admin" ? "bg-red-50 text-red-700 border-red-200" :
                user.role === "project_manager" ? "bg-blue-50 text-blue-700 border-blue-200" :
                "bg-slate-100 text-slate-700 border-slate-200"
              }`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                user.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                {user.status}
              </span>
            </div>
          </div>

          {user.role !== "admin" && (
            <div className="space-y-2">
              <button
                onClick={() => setConfirmRole(true)}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                Change Role
              </button>
              <button
                onClick={() => setConfirmDeactivate(true)}
                disabled={actionLoading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
                  user.status === "active"
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-green-200 text-green-600 hover:bg-green-50"
                }`}
              >
                {user.status === "active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                {user.status === "active" ? "Deactivate" : "Activate"} Account
              </button>
            </div>
          )}
        </div>

        {/* Stats card */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Account Details & Activity</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Member since</dt>
                <dd className="font-medium text-slate-900">{formatDate(user.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Last updated</dt>
                <dd className="font-medium text-slate-900">{formatDate(user.updatedAt)}</dd>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-4 mt-2"></div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Projects Owned</dt>
                <dd className="font-medium text-slate-900">{projects?.owned || 0}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Projects Member</dt>
                <dd className="font-medium text-slate-900">{projects?.memberOf || 0}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Tasks Assigned</dt>
                <dd className="font-medium text-slate-900">{tasks?.assigned || 0}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Tasks Created</dt>
                <dd className="font-medium text-slate-900">{tasks?.created || 0}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Comments Authored</dt>
                <dd className="font-medium text-slate-900">{comments?.authored || 0}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Unread Notifications</dt>
                <dd className="font-medium text-slate-900">{notifications?.unread || 0}</dd>
              </div>
            </dl>
          </div>
          
          {user.status === "active" && !data.canDeactivate && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800">
              <p className="font-semibold mb-1">Cannot Deactivate</p>
              <p>{data.deactivationBlockReason}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => !actionLoading && setConfirmDeactivate(false)}
        onConfirm={toggleStatus}
        title={user?.status === "active" ? "Deactivate User" : "Activate User"}
        description={`Are you sure you want to ${user?.status === "active" ? "deactivate" : "activate"} ${user?.name}?`}
        confirmLabel={user?.status === "active" ? "Deactivate" : "Activate"}
        danger={user?.status === "active"}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={confirmRole}
        onClose={() => !actionLoading && setConfirmRole(false)}
        onConfirm={() => {
          // Find the role to change to, a quick hack for the UI
          const targetRole = user?.role === "team_member" ? "project_manager" : "team_member";
          changeRole(targetRole);
        }}
        title="Change User Role"
        description={`Toggle ${user?.name}'s role between Team Member and Project Manager?`}
        confirmLabel="Confirm Role Change"
        loading={actionLoading}
      />
    </div>
  );
}

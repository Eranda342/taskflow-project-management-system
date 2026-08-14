import { useState } from "react";
import { Link } from "react-router";
import { Search, ChevronDown } from "lucide-react";
import { USERS, getRoleLabel, formatDate } from "../../data/mockData";
import { Avatar } from "../../components/Badge";
import { ConfirmDialog } from "../../components/Modal";
import { useApp } from "../../context/AppContext";

export function AdminUsers() {
  const { addToast } = useApp();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [localUsers, setLocalUsers] = useState(USERS);

  const filtered = localUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const toggleStatus = (user) => {
    setLocalUsers((prev) =>
      prev.map((u) => u.id === user.id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u)
    );
    addToast("success", `${user.name} ${user.status === "active" ? "deactivated" : "activated"}`);
  };

  const changeRole = (userId, role) => {
    setLocalUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, role: role } : u)
    );
    addToast("success", "User role updated");
    setConfirmRoleChange(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h2>
          <p className="text-slate-500 mt-1">{localUsers.length} total users on the platform.</p>
        </div>
        <button onClick={() => addToast("info", "Invite user — coming soon")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
          Invite User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
          <option value="team_member">Team Member</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link to={`/app/admin/users/${user.id}`} className="flex items-center gap-3">
                      <Avatar name={user.name} initials={user.initials} color={user.color} size="sm" />
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          user.role === "admin" ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" :
                          user.role === "project_manager" ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" :
                          "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {getRoleLabel(user.role)}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {openMenu === user.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                            {[
                              { value: "admin", label: "Admin", warn: true },
                              { value: "project_manager", label: "Project Manager", warn: false },
                              { value: "team_member", label: "Team Member", warn: false },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setOpenMenu(null);
                                  setConfirmRoleChange({ user, role: opt.value });
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                  user.role === opt.value
                                    ? "bg-slate-50 font-semibold text-slate-900"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {opt.label}
                                {user.role === opt.value && <span className="ml-2 text-blue-600">✓</span>}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                      user.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/app/admin/users/${user.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => setConfirmDeactivate(user)}
                          className={`text-sm font-medium transition-colors ${
                            user.status === "active" ? "text-slate-500 hover:text-red-600" : "text-green-600 hover:text-green-700"
                          }`}
                        >
                          {user.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">No users found.</div>
          )}
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
          <span>Showing {filtered.length} of {localUsers.length} users</span>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={() => { if (confirmDeactivate) toggleStatus(confirmDeactivate); setConfirmDeactivate(null); }}
        title={confirmDeactivate?.status === "active" ? "Deactivate User" : "Activate User"}
        description={`Are you sure you want to ${confirmDeactivate?.status === "active" ? "deactivate" : "activate"} ${confirmDeactivate?.name}?`}
        confirmLabel={confirmDeactivate?.status === "active" ? "Deactivate" : "Activate"}
        danger={confirmDeactivate?.status === "active"}
      />

      <ConfirmDialog
        open={!!confirmRoleChange}
        onClose={() => setConfirmRoleChange(null)}
        onConfirm={() => { if (confirmRoleChange) changeRole(confirmRoleChange.user.id, confirmRoleChange.role); }}
        title="Change User Role"
        description={`Change ${confirmRoleChange?.user.name}'s role to ${confirmRoleChange ? getRoleLabel(confirmRoleChange.role) : ""}?`}
        confirmLabel="Confirm Role Change"
      />
    </div>
  );
}

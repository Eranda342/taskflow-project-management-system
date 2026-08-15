import { useState } from "react";
import { Camera, Save } from "lucide-react";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

export function Profile() {
  const { user: authUser, addToast, refreshUser } = useApp();
  
  // Use auth user data, fallback to basic defaults for rendering if strictly missing
  const user = authUser ? {
    ...authUser,
    initials: authUser.name ? authUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U",
    color: "bg-blue-600",
    createdAt: authUser.createdAt || new Date().toISOString()
  } : { name: "", email: "", role: "team_member", color: "bg-blue-600", initials: "U" };

  const [form, setForm] = useState({ name: user.name || "", email: user.email || "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/me/profile', { name: form.name });
      await refreshUser();
      addToast("success", "Profile updated successfully");
    } catch (err) {
      addToast("error", err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h2>
        <p className="text-slate-500 mt-1">Manage your personal information and account details.</p>
      </div>

      {/* Avatar section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-5">Profile Photo</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className={`w-20 h-20 rounded-2xl ${user.color} flex items-center justify-center text-white text-2xl font-bold shadow-sm`}>
              {user.initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => addToast("info", "Photo upload coming soon")}
                className="text-xs font-medium text-blue-600 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Upload photo
              </button>
              <button
                onClick={() => addToast("info", "Photo removed")}
                className="text-xs font-medium text-slate-600 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-5">Personal Information</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <input
              type="text"
              value={user.role === "project_manager" ? "Project Manager" : user.role === "admin" ? "Administrator" : "Team Member"}
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Role is managed by your administrator.</p>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving || !form.name.trim() || form.name === user.name}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Account Information</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Member since</dt>
            <dd className="font-medium text-slate-900">{new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Account ID</dt>
            <dd className="font-medium text-slate-500 font-mono text-xs">{user.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Status</dt>
            <dd><span className="text-green-700 font-medium bg-green-50 border border-green-200 px-2 py-0.5 rounded-md text-xs">Active</span></dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

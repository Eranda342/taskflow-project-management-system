import { useState, useEffect, useRef } from "react";
import { User, Bell, Shield, Camera, Save, CheckCheck } from "lucide-react";
import { Link } from "react-router";
import { useApp } from "../context/AppContext";
import api from "../lib/api";
import { setToken } from "../lib/auth";

export function Settings() {
  const { user: authUser, addToast, refreshUser, setUnreadCount } = useApp();
  const [section, setSection] = useState("profile");

  // --- Profile State ---
  const user = authUser ? {
    ...authUser,
    initials: authUser.name ? authUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U",
    color: "bg-blue-600",
    createdAt: authUser.createdAt || new Date().toISOString()
  } : { name: "", email: "", role: "team_member", color: "bg-blue-600", initials: "U", status: "active" };

  const [form, setForm] = useState({ name: user.name || "", email: user.email || "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ name: user.name || "", email: user.email || "" });
  }, [user.name, user.email]);

  // --- Password State ---
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    try {
      const res = await api.patch('/users/me/password', passwordForm);
      if (res.data.success && res.data.data.token) {
        setToken(res.data.data.token);
        // Refresh api instance default header is handled by the interceptor automatically reading from localStorage
      }
      addToast("success", "Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      if (err.response?.data?.errors) {
        const errorMsgs = Object.values(err.response.data.errors).join(", ");
        addToast("error", errorMsgs);
      } else {
        addToast("error", err.response?.data?.message || "Failed to update password");
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
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

  const fileInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const url = uploadRes.data.data.url;

      await api.patch('/users/me/profile', { profileImage: url });
      await refreshUser();
      addToast("success", "Profile photo updated successfully");
    } catch (err) {
      addToast("error", err.response?.data?.message || "Failed to upload photo");
    }
    
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Notifications State ---
  const [actionLoading, setActionLoading] = useState(false);
  const markAllRead = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const { data } = await api.patch("/notifications/read-all");
      if (data.success) {
        setUnreadCount(0);
        addToast("success", "All notifications marked as read");
      }
    } catch (err) {
      addToast("error", err.response?.data?.message || "Failed to mark all as read");
    } finally {
      setActionLoading(false);
    }
  };

  const NAV = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your account preferences and configuration.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <nav className="sm:w-52 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  section === item.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className={section === item.id ? "text-blue-600" : "text-slate-400"}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1">
          {section === "profile" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-5">Profile Photo</h3>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {user.profileImage ? (
                      <img src={`${import.meta.env.VITE_SOCKET_URL}${user.profileImage}`} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                    ) : (
                      <div className={`w-20 h-20 rounded-2xl ${user.color} flex items-center justify-center text-white text-2xl font-bold shadow-sm`}>
                        {user.initials}
                      </div>
                    )}
                    <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs font-medium text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Upload photo</button>
                        {user.profileImage && (
                          <button onClick={async () => {
                            try {
                               await api.patch('/users/me/profile', { profileImage: null });
                               await refreshUser();
                               addToast("success", "Photo removed");
                            } catch(e) { addToast("error", "Failed to remove photo"); }
                          }} className="text-xs font-medium text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Remove</button>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">Recommended size: 256x256px. Max size: 5MB.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-5">Personal Information</h3>
                <form onSubmit={handleSaveProfile} className="space-y-4">
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

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Account Information</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Role</dt>
                    <dd className="font-medium text-slate-900">{user.role === "project_manager" ? "Project Manager" : user.role === "admin" ? "Administrator" : "Team Member"}</dd>
                  </div>
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
                    <dd><span className="text-green-700 font-medium bg-green-50 border border-green-200 px-2 py-0.5 rounded-md text-xs capitalize">{user.status}</span></dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {section === "notifications" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-base font-semibold text-slate-900">Notification Preferences</h3>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Mark all as read</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Clear all unread notification badges.</p>
                </div>
                <button
                  onClick={markAllRead}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark All Read
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <Link to="/app/notifications" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors w-fit">
                  <Bell className="w-4 h-4" />
                  View Notifications Inbox
                </Link>
                <p className="text-xs text-slate-500 mt-2">
                  Detailed notification delivery preferences (Email, Push) are not currently available.
                </p>
              </div>
            </div>
          )}

          {section === "security" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-5">Change Password</h3>
              <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Must be at least 8 characters long.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={passwordSaving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {passwordSaving ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

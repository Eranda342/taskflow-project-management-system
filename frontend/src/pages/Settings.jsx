import { useState } from "react";
import { User, Bell, Shield, Palette, Lock } from "lucide-react";
import { useApp } from "../context/AppContext";

export function Settings() {
  const { addToast } = useApp();
  const [section, setSection] = useState("profile");
  const [notifPrefs, setNotifPrefs] = useState({
    taskAssigned: true,
    taskUpdated: true,
    commentAdded: true,
    memberAdded: false,
    projectUpdated: true,
    emailDigest: false,
  });
  const [theme, setTheme] = useState("light");
  const [displayName, setDisplayName] = useState("Alex Morgan");
  const [timeZone, setTimeZone] = useState("UTC-5 (Eastern Time)");
  const [dateFormat, setDateFormat] = useState("MMM D, YYYY");
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const NAV = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your account preferences and configuration.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar nav */}
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

        {/* Content */}
        <div className="flex-1">
          {section === "profile" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900">Profile Settings</h3>
              <p className="text-sm text-slate-500">Update your personal information on the <a href="/app/profile" className="text-blue-600 hover:underline">Profile page</a>.</p>
              <div className="space-y-4 pt-2">
                <div>
                  <label htmlFor="display-name" className="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
                  <input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="time-zone" className="block text-sm font-medium text-slate-700 mb-1.5">Time Zone</label>
                  <select
                    id="time-zone"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC+0 (London)</option>
                    <option>UTC+1 (Paris)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="date-format" className="block text-sm font-medium text-slate-700 mb-1.5">Date Format</label>
                  <select
                    id="date-format"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>MMM D, YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (!displayName.trim()) return;
                    addToast("success", "Settings saved");
                  }}
                  disabled={!displayName.trim()}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {section === "notifications" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-base font-semibold text-slate-900">Notification Preferences</h3>
              <p className="text-sm text-slate-500">Choose what events you want to be notified about.</p>
              <div className="space-y-4">
                {[
                  { key: "taskAssigned", label: "Task assigned to me" },
                  { key: "taskUpdated", label: "Task status updated" },
                  { key: "commentAdded", label: "New comment on my tasks" },
                  { key: "memberAdded", label: "Added to a project" },
                  { key: "projectUpdated", label: "Project updates" },
                  { key: "emailDigest", label: "Weekly email digest" },
                ].map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{pref.label}</div>
                    </div>
                    <button
                      onClick={() => {
                        setNotifPrefs((prev) => ({ ...prev, [pref.key]: !prev[pref.key] }));
                        addToast("success", "Preference updated");
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        notifPrefs[pref.key] ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                          notifPrefs[pref.key] ? "translate-x-[18px]" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "security" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-base font-semibold text-slate-900">Security</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {newPwd && newPwd.length < 8 && (
                    <p className="text-xs text-red-600 mt-1">Password must be at least 8 characters</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {confirmPwd && newPwd !== confirmPwd && (
                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (newPwd.length >= 8 && newPwd === confirmPwd) {
                      addToast("success", "Password changed successfully");
                      setOldPwd(""); setNewPwd(""); setConfirmPwd("");
                    } else {
                      addToast("error", "Please fix the errors above");
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Update Password
                </button>
              </div>
            </div>
          )}

          {section === "appearance" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-base font-semibold text-slate-900">Appearance</h3>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Theme</p>
                <div className="grid grid-cols-3 gap-3">
                  {["light", "dark", "system"].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTheme(t); addToast("success", `${t.charAt(0).toUpperCase() + t.slice(1)} theme applied`); }}
                      className={`p-4 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                        theme === t ? "border-blue-600 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-full h-12 rounded-lg mb-2 ${
                        t === "light" ? "bg-white border border-slate-200" :
                        t === "dark" ? "bg-slate-900" : "bg-gradient-to-r from-white to-slate-900"
                      }`} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

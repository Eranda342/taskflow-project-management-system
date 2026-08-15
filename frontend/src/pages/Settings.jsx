import { useState } from "react";
import { User, Bell, Shield, Palette } from "lucide-react";
import { Link } from "react-router";

export function Settings() {
  const [section, setSection] = useState("profile");

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
              <p className="text-sm text-slate-500">
                Update your personal information on the <Link to="/app/profile" className="text-blue-600 hover:underline">Profile page</Link>.
              </p>
              
              <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">Note:</span> Time Zone and Date Format preferences are not currently supported by the backend.
                </p>
              </div>
            </div>
          )}

          {section === "notifications" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-base font-semibold text-slate-900">Notification Preferences</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-600 text-center py-4">
                  Custom notification preferences are not currently available.
                </p>
              </div>
            </div>
          )}

          {section === "security" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-base font-semibold text-slate-900">Security</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-600 text-center py-4">
                  Password changes must be handled by an administrator. Please contact your system admin.
                </p>
              </div>
            </div>
          )}

          {section === "appearance" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-base font-semibold text-slate-900">Appearance</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-600 text-center py-4">
                  Theme selection is not currently supported.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

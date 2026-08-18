import { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
  Settings,
  LogOut,
  Users,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  User,
  FlaskConical,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ToastContainer } from "../components/Toast";



export function Layout() {
  const { user, role, unreadCount, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Fallback while user is loading, although ProtectedRoute prevents rendering if not authenticated
  const currentUser = user || { name: "", initials: "", color: "bg-blue-600", roleLabel: "" };
  const currentRole = role || "team_member";
  // Add roleLabel and initials properties since the backend only gives role/name/email
  const roleLabelMap = {
    admin: "Administrator",
    project_manager: "Project Manager",
    team_member: "Team Member",
  };
  currentUser.roleLabel = roleLabelMap[currentRole] || "User";
  currentUser.initials = currentUser.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";
  currentUser.color = "bg-blue-600"; // Can be dynamic later

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <Link to="/app/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">TaskFlow</span>
          </Link>
          <button
            className="md:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>



        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          <NavLabel>Main</NavLabel>
          {currentRole === "admin" ? (
            <SideNavItem to="/app/admin" icon={<LayoutDashboard size={17} />} label="Dashboard" onClick={() => setSidebarOpen(false)} />
          ) : currentRole === "team_member" ? (
            <SideNavItem to="/app/team-dashboard" icon={<LayoutDashboard size={17} />} label="Dashboard" onClick={() => setSidebarOpen(false)} />
          ) : (
            <SideNavItem to="/app/dashboard" icon={<LayoutDashboard size={17} />} label="Dashboard" onClick={() => setSidebarOpen(false)} />
          )}
          <SideNavItem to="/app/projects" icon={<FolderKanban size={17} />} label="Projects" onClick={() => setSidebarOpen(false)} />
          {currentRole === "team_member" ? (
            <SideNavItem to="/app/my-tasks" icon={<CheckSquare size={17} />} label="My Tasks" onClick={() => setSidebarOpen(false)} />
          ) : (
            <SideNavItem to="/app/tasks" icon={<CheckSquare size={17} />} label="Tasks" onClick={() => setSidebarOpen(false)} />
          )}
          <SideNavItem to="/app/notifications" icon={<Bell size={17} />} label="Notifications" badge={unreadCount > 0 ? String(unreadCount) : undefined} onClick={() => setSidebarOpen(false)} />

          {currentRole === "admin" && (
            <>
              <NavLabel className="mt-4">Administration</NavLabel>
              <SideNavItem to="/app/admin/users" icon={<Users size={17} />} label="Users" onClick={() => setSidebarOpen(false)} />
              <SideNavItem to="/app/admin/projects" icon={<FolderKanban size={17} />} label="All Projects" onClick={() => setSidebarOpen(false)} />
              <SideNavItem to="/app/admin/analytics" icon={<BarChart3 size={17} />} label="Analytics" onClick={() => setSidebarOpen(false)} />
            </>
          )}
        </nav>

        {/* User area */}
        <div className="p-3 border-t border-slate-800 shrink-0 space-y-1">
          <SideNavItem to="/app/settings" icon={<Settings size={17} />} label="Settings" onClick={() => setSidebarOpen(false)} />
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>

          <div className="mt-2 pt-2 border-t border-slate-800">
            <Link to="/app/profile" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors" onClick={() => setSidebarOpen(false)}>
              <div className={`w-9 h-9 rounded-full ${currentUser.color} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                {currentUser.initials}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-white truncate">{currentUser.name}</div>
                <div className="text-xs text-slate-400 truncate">{currentUser.roleLabel}</div>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-slate-500 hover:text-slate-900 p-1"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications bell */}
            <Link
              to="/app/notifications"
              className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full ${currentUser.color} flex items-center justify-center text-white font-semibold text-sm`}>
                  {currentUser.initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-slate-900 leading-none">{currentUser.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{currentUser.roleLabel}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="text-sm font-semibold text-slate-900">{currentUser.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{currentUser.roleLabel}</div>
                    </div>
                    <div className="py-1">
                      <DropdownLink to="/app/profile" icon={<User className="w-4 h-4" />} label="My Profile" onClick={() => setProfileOpen(false)} />
                      <DropdownLink to="/app/settings" icon={<Settings className="w-4 h-4" />} label="Settings" onClick={() => setProfileOpen(false)} />
                    </div>
                    <div className="py-1 border-t border-slate-100">
                      <button
                        onClick={() => { setProfileOpen(false); logout(); navigate("/login"); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}



function NavLabel({ children, className = "" }) {
  return (
    <div className={`text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 px-3 pt-2 ${className}`}>
      {children}
    </div>
  );
}

function SideNavItem({ to, icon, label, badge, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            <span className={isActive ? "text-white" : "text-slate-400"}>{icon}</span>
            {label}
          </div>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? "bg-blue-500 text-white" : "bg-red-500 text-white"}`}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function DropdownLink({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <span className="text-slate-400">{icon}</span>
      {label}
    </Link>
  );
}

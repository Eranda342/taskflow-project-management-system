import { useParams, Link } from "react-router";
import { ChevronRight, Shield, UserCheck, UserX } from "lucide-react";
import { USERS, TASKS, PROJECTS, getRoleLabel, formatDate } from "../../data/mockData";
import { Avatar } from "../../components/Badge";
import { useApp } from "../../context/AppContext";

export function AdminUserDetails() {
  const { userId } = useParams();
  const { addToast } = useApp();

  const user = USERS.find((u) => u.id === userId);
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">User not found</h2>
        <Link to="/app/admin/users" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Users</Link>
      </div>
    );
  }

  const assignedTasks = TASKS.filter((t) => t.assigneeId === user.id);
  const memberProjects = PROJECTS.filter((p) => p.memberIds.includes(user.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/app/admin/users" className="hover:text-blue-600 transition-colors">Users</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium">{user.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
            <Avatar name={user.name} initials={user.initials} color={user.color} size="lg" />
            <h2 className="text-lg font-bold text-slate-900 mt-3">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                user.role === "admin" ? "bg-red-50 text-red-700 border-red-200" :
                user.role === "project_manager" ? "bg-blue-50 text-blue-700 border-blue-200" :
                "bg-slate-100 text-slate-700 border-slate-200"
              }`}>
                {getRoleLabel(user.role)}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                user.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                {user.status}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Account Details</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Member since</dt>
                <dd className="font-medium text-slate-900">{formatDate(user.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Projects</dt>
                <dd className="font-medium text-slate-900">{memberProjects.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Tasks assigned</dt>
                <dd className="font-medium text-slate-900">{assignedTasks.length}</dd>
              </div>
            </dl>
          </div>

          {user.role !== "admin" && (
            <div className="space-y-2">
              <button
                onClick={() => addToast("info", "Role management coming soon")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Change Role
              </button>
              <button
                onClick={() => addToast("success", `${user.name} ${user.status === "active" ? "deactivated" : "activated"}`)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
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

        {/* Right content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Projects ({memberProjects.length})</h3>
            </div>
            {memberProjects.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No projects.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {memberProjects.map((proj) => (
                  <Link key={proj.id} to={`/app/projects/${proj.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                    <div>
                      <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{proj.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{proj.tasksTotal} tasks</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${proj.progress}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{proj.progress}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Assigned Tasks ({assignedTasks.length})</h3>
            </div>
            {assignedTasks.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No tasks assigned.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignedTasks.map((task) => (
                  <Link key={task.id} to={`/app/tasks/${task.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                    <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{task.title}</div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        task.status === "completed" ? "text-green-700 bg-green-50" :
                        task.status === "in_progress" ? "text-blue-700 bg-blue-50" : "text-slate-600 bg-slate-100"
                      }`}>{task.status.replace("_", " ")}</span>
                      <span className="text-xs text-slate-400">{formatDate(task.dueDate)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

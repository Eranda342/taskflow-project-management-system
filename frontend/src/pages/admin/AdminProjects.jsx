import { Link } from "react-router";
import { PROJECTS, getUser, formatDate } from "../../data/mockData";
import { StatusBadge, Avatar } from "../../components/Badge";

export function AdminProjects() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">All Projects</h2>
        <p className="text-slate-500 mt-1">Platform-wide view of all {PROJECTS.length} projects.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Project</th>
                <th className="px-6 py-3 font-medium">Owner</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Members</th>
                <th className="px-6 py-3 font-medium">Tasks</th>
                <th className="px-6 py-3 font-medium">Progress</th>
                <th className="px-6 py-3 font-medium">Deadline</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PROJECTS.map((proj) => {
                const owner = getUser(proj.ownerId);
                return (
                  <tr key={proj.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/app/projects/${proj.id}`} className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {proj.name}
                      </Link>
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{proj.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      {owner && (
                        <div className="flex items-center gap-2">
                          <Avatar name={owner.name} initials={owner.initials} color={owner.color} size="sm" />
                          <span className="text-slate-700">{owner.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={proj.status} /></td>
                    <td className="px-6 py-4 text-slate-600">{proj.memberIds.length}</td>
                    <td className="px-6 py-4 text-slate-600">{proj.tasksCompleted}/{proj.tasksTotal}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${proj.progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-600">{proj.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(proj.deadline)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/app/projects/${proj.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 text-sm text-slate-500">
          Showing all {PROJECTS.length} projects
        </div>
      </div>
    </div>
  );
}

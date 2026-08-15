import { Link } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { StatusBadge, Avatar } from "../../components/Badge";
import { useApp } from "../../context/AppContext";
import api from "../../lib/api";

export function AdminProjects() {
  const { addToast } = useApp();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      // Admin sees all projects regardless of membership
      const { data } = await api.get("/projects", { params: { limit: 100 } });
      if (data.success) {
        setProjects(data.data.projects);
      }
    } catch (error) {
      addToast("error", error.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">All Projects</h2>
        <p className="text-slate-500 mt-1">Platform-wide view of all projects.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Project</th>
                <th className="px-6 py-3 font-medium">Owner</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Members</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium">Deadline</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((proj) => {
                const owner = proj.owner;
                return (
                  <tr key={proj._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/app/projects/${proj._id}`} className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {proj.name}
                      </Link>
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{proj.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      {owner ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={owner.name} initials={owner.profileImage ? null : undefined} color="bg-blue-600" size="sm" />
                          <span className="text-slate-700">{owner.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={proj.status} /></td>
                    <td className="px-6 py-4 text-slate-600">{proj.members?.length || 0}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(proj.createdAt)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(proj.deadline)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/app/projects/${proj._id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && projects.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">No projects found.</div>
          )}
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
          <span>Showing {projects.length} projects</span>
        </div>
      </div>
    </div>
  );
}

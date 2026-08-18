import { useState, useEffect, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { StatusBadge, Avatar } from "../components/Badge";
import { Modal } from "../components/Modal";
import CreateProjectModal from "../components/CreateProjectModal";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "planning", label: "Planning" },
  { value: "review", label: "Review" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

export function Projects() {
  const { addToast, user } = useApp();
  const canCreateProject = user?.role === "admin" || user?.role === "project_manager";
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state (if supported)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const limit = 10;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
      });
      if (search.trim()) {
        queryParams.append("search", search.trim());
      }
      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }

      const res = await api.get(`/projects?${queryParams.toString()}`);
      if (res.data.success) {
        setProjects(res.data.data.projects);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalProjects(res.data.data.pagination.totalProjects);
      } else {
        throw new Error(res.data.message || "Failed to load projects");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error loading projects";
      setError(msg);
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, addToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const urlSearch = searchParams.get("search");
  useEffect(() => {
    if (urlSearch !== null) {
      setSearch(urlSearch);
      setPage(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h2>
          <p className="text-slate-500 mt-1">Manage and collaborate on your team's projects.</p>
        </div>
        {canCreateProject && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Project Name</th>
                  <th className="px-6 py-4 font-medium">Owner</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Members</th>
                  <th className="px-6 py-4 font-medium">Deadline</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">No projects found.</td>
                  </tr>
                ) : (
                  projects.map((proj) => {
                    const owner = proj.owner;
                    const memberCount = proj.members?.length || 0;
                    return (
                      <tr key={proj._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <Link to={`/app/projects/${proj._id}`} className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {proj.name}
                          </Link>
                          <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{proj.description}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {owner ? (
                            <div className="flex items-center gap-2">
                              {owner.profileImage ? (
                                <img src={owner.profileImage} alt={owner.name} className="w-6 h-6 rounded-full" />
                              ) : (
                                <Avatar name={owner.name} initials={owner.name?.[0]} color="bg-blue-100 text-blue-700" size="sm" />
                              )}
                              {owner.name?.split(" ")[0]}
                            </div>
                          ) : "Unknown"}
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={proj.status} /></td>
                        <td className="px-6 py-4 text-slate-600">{memberCount}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {proj.deadline ? new Date(proj.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "None"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/app/projects/${proj._id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && projects.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
            <div>Showing {projects.length} of {totalProjects} projects</div>
            <div className="flex gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateProjectModal 
        open={createOpen} 
        onClose={() => setCreateOpen(false)} 
        onProjectCreated={() => {
          setPage(1);
          fetchProjects();
        }}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useApp } from "../context/AppContext";
import api from "../lib/api";

export default function CreateTaskModal({ open, onClose, projectId, members: propMembers, onTaskCreated }) {
  const { addToast } = useApp();
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState(propMembers || []);

  useEffect(() => {
    if (propMembers) {
      setMembers(propMembers);
    } else if (open && projectId) {
      api.get(`/projects/${projectId}/members`)
        .then(res => setMembers(res.data.data.members || []))
        .catch(() => {});
    }
  }, [open, projectId, propMembers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
      };
      
      if (form.dueDate) {
        payload.dueDate = form.dueDate;
      }

      // 1. Create the task
      const res = await api.post(`/projects/${projectId}/tasks`, payload);
      
      if (res.data.success) {
        let task = res.data.data.task;

        // 2. Handle assignment if an assignee was selected
        if (form.assignedTo) {
          try {
            const assignRes = await api.patch(`/tasks/${task._id}/assign`, { userId: form.assignedTo });
            if (assignRes.data.success) {
              task = assignRes.data.data.task;
            }
          } catch (assignErr) {
            addToast("error", "Task created, but failed to assign user.");
          }
        }

        if (onTaskCreated) {
          onTaskCreated(task);
        } else {
          addToast("success", "Task created successfully");
        }
        
        onClose();
        setForm({ title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" });
      } else {
        throw new Error(res.data.message || "Failed to create task");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error creating task";
      setError(msg);
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Task title"
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add a description..."
            rows={3}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assignee</label>
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Unassigned</option>
              {members.map((u) => {
                const user = u.user || u;
                return (
                  <option key={user._id || user.id} value={user._id || user.id}>
                    {user.name} {user.role === 'project_manager' ? '(PM)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-3 pt-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors" disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
}

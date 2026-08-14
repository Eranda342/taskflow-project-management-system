import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      bg: "bg-white border-green-200",
      bar: "bg-green-500",
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      bg: "bg-white border-red-200",
      bar: "bg-red-500",
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      bg: "bg-white border-amber-200",
      bar: "bg-amber-500",
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-600" />,
      bg: "bg-white border-blue-200",
      bar: "bg-blue-500",
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border shadow-lg px-4 py-3 min-w-[280px] max-w-sm ${config.bg} animate-in slide-in-from-bottom-4 duration-300`}
    >
      {config.icon}
      <span className="flex-1 text-sm font-medium text-slate-800">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

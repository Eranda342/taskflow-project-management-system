import { Link, useNavigate } from "react-router";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";

export function Forbidden() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-in fade-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <ShieldOff className="w-10 h-10 text-amber-500" />
          </div>
        </div>
        <div className="text-7xl font-black text-slate-100 leading-none mb-4 select-none">403</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access denied</h1>
        <p className="text-slate-500 mb-8">
          You don't have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
          <Link
            to="/app/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

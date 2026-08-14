import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, CheckCircle, Lock } from "lucide-react";

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!password) e.password = "Password is required.";
    else if (password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!confirm) e.confirm = "Please confirm your password.";
    else if (password && confirm !== password) e.confirm = "Passwords do not match.";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    }, 1200);
  };

  if (success) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Password updated</h3>
          <p className="text-sm text-slate-500 mt-2">
            Your password has been reset successfully. Redirecting you to sign in...
          </p>
        </div>
        <Link to="/login" className="inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
          Go to sign in now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 text-center">Set new password</h3>
        <p className="text-sm text-slate-500 text-center mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            New password <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
              placeholder="At least 8 characters"
              className={`block w-full pl-9 pr-10 py-2.5 rounded-lg border text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.password ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
          {password && password.length >= 8 && !errors.password && (
            <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Strong password
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
            Confirm new password <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setErrors((prev) => ({ ...prev, confirm: undefined })); }}
              placeholder="Repeat your password"
              className={`block w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.confirm ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
              }`}
            />
          </div>
          {errors.confirm && <p className="mt-1.5 text-xs text-red-600">{errors.confirm}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      <div className="text-center">
        <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

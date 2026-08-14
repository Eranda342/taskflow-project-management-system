import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useApp } from "../context/AppContext";

export function Register() {
  const navigate = useNavigate();
  const { register, addToast } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("team_member");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Full name is required.";
    if (!email) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!confirm) e.confirm = "Please confirm your password.";
    else if (confirm !== password) e.confirm = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, role });
      addToast("success", "Account created successfully. Please log in.");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      addToast("error", msg);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    error: errors[key],
    onChange: () => setErrors((p) => { const n = { ...p }; delete n[key]; return n; }),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 text-center">Create an account</h3>
        <p className="text-sm text-slate-500 text-center mt-1">
          Start managing your projects today.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Full name <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => { setName(e.target.value); field("name").onChange(); }}
              placeholder="Jane Doe"
              className={`block w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.name ? "border-red-400 bg-red-50" : "border-slate-300"
              }`}
            />
          </div>
          {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email address <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); field("email").onChange(); }}
              placeholder="you@example.com"
              className={`block w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.email ? "border-red-400 bg-red-50" : "border-slate-300"
              }`}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); field("password").onChange(); }}
              placeholder="At least 8 characters"
              className={`block w-full pl-9 pr-10 py-2.5 rounded-lg border text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.password ? "border-red-400 bg-red-50" : "border-slate-300"
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
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
            Confirm password <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); field("confirm").onChange(); }}
              placeholder="Repeat your password"
              className={`block w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.confirm ? "border-red-400 bg-red-50" : "border-slate-300"
              }`}
            />
          </div>
          {errors.confirm && <p className="mt-1.5 text-xs text-red-600">{errors.confirm}</p>}
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-slate-700">
            Account Type <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <select
              id="role"
              value={role}
              onChange={(e) => { setRole(e.target.value); field("role").onChange(); }}
              className="block w-full px-3 py-2.5 rounded-lg border text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-slate-300 bg-white"
            >
              <option value="team_member">Team Member</option>
              <option value="project_manager">Project Manager</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}

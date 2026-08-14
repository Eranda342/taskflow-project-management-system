import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  CheckSquare,
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
  FolderKanban,
  CheckCircle2,
  Bell,
  Users,
  BarChart3,
  Zap,
  Shield,
  MessageSquare,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

/* ─── Sticky Nav ─── */
function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className={`font-bold text-lg tracking-tight ${scrolled ? "text-slate-900" : "text-white"}`}>TaskFlow</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {["features", "how-it-works", "benefits", "about"].map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors capitalize ${scrolled ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100" : "text-slate-200 hover:text-white hover:bg-white/10"}`}
              >
                {id.replace("-", " ")}
              </button>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className={`text-sm font-medium transition-colors ${scrolled ? "text-slate-700 hover:text-blue-600" : "text-slate-200 hover:text-white"}`}>
              Log in
            </Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {["features", "how-it-works", "benefits", "about"].map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 capitalize transition-colors"
              >
                {id.replace("-", " ")}
              </button>
            ))}
            <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
              <Link to="/login" className="flex-1 text-center px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Log in
              </Link>
              <Link to="/register" className="flex-1 text-center px-3 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─── Mini Dashboard Mockup ─── */
function DashboardMockup() {
  return (
    <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-[11px] leading-none">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-slate-100 rounded-md h-5 flex items-center px-2 text-slate-400 text-[10px]">app.taskflow.io/dashboard</div>
      </div>
      {/* App shell */}
      <div className="flex h-[340px]">
        {/* Sidebar */}
        <div className="w-36 bg-slate-900 flex-shrink-0 p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 mb-2">
            <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center"><CheckSquare className="w-2.5 h-2.5 text-white" /></div>
            <span className="text-white font-bold text-[10px]">TaskFlow</span>
          </div>
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            { icon: FolderKanban, label: "Projects", active: false },
            { icon: CheckSquare, label: "Tasks", active: false },
            { icon: Bell, label: "Notifications", active: false },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${active ? "bg-blue-600 text-white" : "text-slate-400"}`}>
              <Icon className="w-3 h-3 shrink-0" />
              <span className="text-[9px] font-medium">{label}</span>
            </div>
          ))}
          <div className="mt-auto pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[7px]">AM</div>
              <div>
                <div className="text-white text-[9px] font-medium">Alex M.</div>
                <div className="text-slate-500 text-[8px]">PM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-slate-50 p-4 overflow-hidden">
          <div className="text-slate-900 font-bold text-[13px] mb-1">Good morning, Alex</div>
          <div className="text-slate-500 text-[10px] mb-3">Here's what's happening with your projects.</div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "Projects", value: "6", color: "text-blue-600" },
              { label: "Active", value: "4", color: "text-emerald-600" },
              { label: "Tasks", value: "10", color: "text-indigo-600" },
              { label: "Overdue", value: "3", color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-2">
                <div className={`font-bold text-[14px] ${s.color}`}>{s.value}</div>
                <div className="text-slate-500 text-[9px] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent projects */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 text-slate-700 font-semibold text-[10px]">Recent Projects</div>
            {[
              { name: "Website Redesign", status: "Active", progress: 72, color: "bg-blue-500" },
              { name: "Mobile App v2", status: "Review", progress: 45, color: "bg-amber-500" },
              { name: "API Integration", status: "Planning", progress: 18, color: "bg-slate-400" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-2 px-3 py-2 border-b border-slate-50 last:border-0">
                <div className="flex-1">
                  <div className="text-slate-800 font-medium text-[9px]">{p.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 bg-slate-100 rounded-full h-1">
                      <div className={`h-1 rounded-full ${p.color}`} style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-slate-400 text-[8px]">{p.progress}%</span>
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${p.status === "Active" ? "bg-blue-50 text-blue-700" : p.status === "Review" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero ─── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-slate-900">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.35),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_80%,rgba(37,99,235,0.12),transparent)]" />
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Built for modern teams
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6">
              Manage Projects.{" "}
              <span className="text-blue-400">Empower Teams.</span>{" "}
              Get Things Done.
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
              TaskFlow brings projects, tasks, teams, communication, and progress tracking together in one simple workspace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-base hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-colors"
              >
                Explore TaskFlow
              </button>
            </div>

            {/* Feature highlights */}
            <div className="flex items-center gap-6 mt-12 pt-8 border-t border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                Role-based access
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                Real-time updates
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm hidden sm:flex">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                Free to try
              </div>
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-8 bg-blue-600/5 rounded-3xl blur-2xl" />
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Value Bar ─── */
function ValueBar() {
  const items = [
    { icon: FolderKanban, label: "Centralized project management" },
    { icon: Users, label: "Real-time team collaboration" },
    { icon: CheckCircle2, label: "Clear task tracking" },
    { icon: BarChart3, label: "Actionable project insights" },
  ];

  return (
    <section className="bg-white border-y border-slate-200 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-slate-500 text-sm font-medium mb-8">Everything your team needs to stay organized</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function FeaturesSection() {
  const features = [
    { icon: FolderKanban, title: "Project Management", desc: "Create, organize, monitor, and manage projects from one workspace.", color: "blue" },
    { icon: CheckSquare, title: "Task Management", desc: "Create tasks, assign team members, track status, priorities, and deadlines.", color: "indigo" },
    { icon: Users, title: "Team Collaboration", desc: "Add team members and collaborate around projects and tasks effortlessly.", color: "violet" },
    { icon: Zap, title: "Real-Time Updates", desc: "Receive real-time updates for important project and task activities instantly.", color: "amber" },
    { icon: Bell, title: "Notifications", desc: "Keep users informed about assignments, project changes, and collaboration events.", color: "orange" },
    { icon: TrendingUp, title: "Progress Tracking", desc: "Monitor project progress, task completion, deadlines, and workload.", color: "emerald" },
    { icon: Shield, title: "Role-Based Access", desc: "Support different user roles and permissions across your organization.", color: "slate" },
    { icon: BarChart3, title: "Dashboard Analytics", desc: "Useful project and task statistics through comprehensive dashboards.", color: "blue" },
  ];

  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    orange: "bg-orange-50 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Everything you need to ship projects
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            TaskFlow gives your team the tools to plan, execute, and deliver — from a single, unified workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-md transition-all duration-200 group">
              <div className={`w-11 h-11 rounded-xl ${colorMap[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorksSection() {
  const steps = [
    { n: "01", title: "Create a Project", desc: "Set up a project workspace and define its goals, milestones, and timeline." },
    { n: "02", title: "Build Your Team", desc: "Invite team members and assign roles. Everyone knows what they're responsible for." },
    { n: "03", title: "Manage Tasks", desc: "Create, assign, prioritize, and track tasks across your project with full visibility." },
    { n: "04", title: "Track Progress", desc: "Monitor completion rates, deadlines, and workload to keep everything on track." },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
            How it works
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Up and running in minutes
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Four simple steps to bring your team and projects together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" style={{ width: "50%", left: "25%" }} />

          {steps.map((step, i) => (
            <div key={step.n} className="relative flex flex-col items-start lg:items-center lg:text-center">
              <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-lg mb-4 shadow-lg shadow-blue-600/25">
                {step.n}
              </div>
              {/* Arrow between steps */}
              {i < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-[26px] left-[calc(100%-12px)] z-0 items-center">
                  <ChevronRight className="w-4 h-4 text-blue-300" />
                </div>
              )}
              <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Product Preview ─── */
function ProductPreviewSection() {
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: "Dashboard", content: (
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total Projects", value: "6", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Tasks", value: "7", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Completed", value: "3", color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Overdue", value: "3", color: "text-red-600", bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-medium text-slate-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    )},
    { label: "Projects", content: (
      <div className="space-y-2">
        {[
          { name: "Website Redesign", status: "Active", members: 4, progress: 72 },
          { name: "Mobile App v2.0", status: "Review", members: 3, progress: 45 },
          { name: "API Integration", status: "Planning", members: 2, progress: 18 },
          { name: "Data Pipeline", status: "Active", members: 5, progress: 61 },
        ].map((p) => (
          <div key={p.name} className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 px-5 py-3.5">
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-900">{p.name}</span>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${p.status === "Active" ? "bg-blue-50 text-blue-700 border-blue-200" : p.status === "Review" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>{p.status}</span>
            <div className="flex items-center gap-2 w-28">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${p.progress}%` }} />
              </div>
              <span className="text-xs text-slate-500 shrink-0">{p.progress}%</span>
            </div>
            <span className="text-xs text-slate-400">{p.members} members</span>
          </div>
        ))}
      </div>
    )},
    { label: "Tasks", content: (
      <div className="grid grid-cols-4 gap-4 h-52">
        {[
          { label: "To Do", count: 2, color: "bg-slate-500", tasks: ["Set up CI pipeline", "Write API docs"] },
          { label: "In Progress", count: 3, color: "bg-blue-600", tasks: ["Design system", "Auth flow", "Dashboard"] },
          { label: "Review", count: 2, color: "bg-amber-500", tasks: ["Landing page", "Search feature"] },
          { label: "Completed", count: 3, color: "bg-green-600", tasks: ["DB schema", "User model", "Login page"] },
        ].map((col) => (
          <div key={col.label} className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
              <span className="text-xs font-semibold text-slate-700">{col.label}</span>
              <span className="ml-auto text-xs text-slate-400">{col.count}</span>
            </div>
            {col.tasks.map((t) => (
              <div key={t} className="bg-white rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 font-medium shadow-sm">{t}</div>
            ))}
          </div>
        ))}
      </div>
    )},
    { label: "Notifications", content: (
      <div className="space-y-3">
        {[
          { avatar: "AM", color: "bg-blue-600", text: "Alex Morgan assigned you to Website Redesign", time: "2m ago", unread: true },
          { avatar: "SK", color: "bg-violet-600", text: "Sara Kim commented on Dashboard task", time: "18m ago", unread: true },
          { avatar: "JL", color: "bg-emerald-600", text: "James Lee completed API Integration task", time: "1h ago", unread: false },
          { avatar: "MC", color: "bg-amber-600", text: "Maria Chen added you to Mobile App project", time: "3h ago", unread: false },
        ].map((n, i) => (
          <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${n.unread ? "bg-blue-50/60 border-blue-100" : "bg-white border-slate-200"}`}>
            <div className={`w-8 h-8 rounded-full ${n.color} text-white flex items-center justify-center text-xs font-bold shrink-0`}>{n.avatar}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">{n.text}</p>
              <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
            </div>
            {n.unread && <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />}
          </div>
        ))}
      </div>
    )},
  ];

  return (
    <section className="py-24 bg-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-4">
            Product preview
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            See TaskFlow in action
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            A clean, intuitive interface designed to reduce friction and help your team focus on what matters.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-slate-200 bg-slate-50/80">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setTab(i)}
                className={`px-5 py-3.5 text-sm font-medium transition-colors ${tab === i ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-6 bg-slate-50 min-h-[220px]">
            {tabs[tab].content}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Benefits ─── */
function BenefitsSection() {
  const items = [
    { title: "Reduce project complexity", desc: "Break down large projects into manageable tasks with clear ownership and priorities.", icon: FolderKanban },
    { title: "Improve team visibility", desc: "Everyone sees the same picture. No more status-update meetings or lost messages.", icon: Users },
    { title: "Never miss deadlines", desc: "Deadline tracking and overdue alerts ensure nothing slips through the cracks.", icon: Bell },
    { title: "Keep communication organized", desc: "Comments and activity feeds keep all project conversations in one place.", icon: MessageSquare },
    { title: "Understand project progress", desc: "Visual progress bars, completion rates, and analytics tell you exactly where things stand.", icon: TrendingUp },
    { title: "Manage work from one place", desc: "No more switching between tools. Projects, tasks, team, and updates — all in TaskFlow.", icon: LayoutDashboard },
  ];

  return (
    <section id="benefits" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-6">
              Benefits
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 leading-tight">
              Built for teams that ship
            </h2>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed">
              TaskFlow removes the overhead that slows teams down — so your people can focus on the work that moves projects forward.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right — benefits grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {items.map(({ title, desc, icon: Icon }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-200 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── User Roles ─── */
function UserRolesSection() {
  const roles = [
    {
      title: "Project Manager",
      color: "border-blue-200 bg-blue-50/50",
      badge: "bg-blue-100 text-blue-700",
      icon: FolderKanban,
      iconBg: "bg-blue-100 text-blue-600",
      perks: ["Create and manage projects", "Add team members", "Assign and track tasks", "Monitor progress and deadlines"],
    },
    {
      title: "Team Member",
      color: "border-emerald-200 bg-emerald-50/50",
      badge: "bg-emerald-100 text-emerald-700",
      icon: CheckSquare,
      iconBg: "bg-emerald-100 text-emerald-600",
      perks: ["View assigned tasks", "Update task status and progress", "Collaborate through comments", "Track project activity"],
    },
    {
      title: "Administrator",
      color: "border-violet-200 bg-violet-50/50",
      badge: "bg-violet-100 text-violet-700",
      icon: Shield,
      iconBg: "bg-violet-100 text-violet-600",
      perks: ["Manage users and permissions", "Platform-level settings", "Monitor platform activity", "Manage all projects and tasks"],
    },
  ];

  return (
    <section id="about" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
            Role-based access
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            The right access for every team member
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            TaskFlow adapts to your team structure with purpose-built roles that give everyone exactly what they need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map(({ title, color, badge, icon: Icon, iconBg, perks }) => (
            <div key={title} className={`rounded-2xl border-2 p-7 ${color} hover:shadow-md transition-all duration-200`}>
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${badge} mb-3`}>{title}</div>
              <ul className="space-y-2.5 mt-4">
                {perks.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTASection() {
  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(37,99,235,0.2),transparent)]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
          Ready to take control of your projects?
        </h2>
        <p className="text-xl text-slate-400 mb-10">
          Bring your projects, tasks, and team collaboration together with TaskFlow.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/30"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-slate-700 text-slate-300 text-base font-semibold hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">TaskFlow</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Simple project management for productive teams. Stay organized, hit your deadlines, ship great work.
            </p>
          </div>

          {/* Links */}
          {[
            {
              title: "Product",
              links: [
                { label: "Features", href: "#features", scroll: true },
                { label: "How It Works", href: "#how-it-works", scroll: true },
                { label: "Benefits", href: "#benefits", scroll: true },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "#about", scroll: true },
              ],
            },
            {
              title: "Resources",
              links: [
                { label: "Documentation", href: "#", scroll: false },
                { label: "Help Center", href: "#", scroll: false },
              ],
            },
            {
              title: "Account",
              links: [
                { label: "Log in", href: "/login", scroll: false },
                { label: "Register", href: "/register", scroll: false },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) =>
                  l.scroll ? (
                    <li key={l.label}>
                      <button
                        onClick={() => document.getElementById(l.href.replace("#", ""))?.scrollIntoView({ behavior: "smooth" })}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {l.label}
                      </button>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <Link to={l.href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">© 2026 TaskFlow. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="text-sm text-slate-600">Privacy Policy</span>
            <span className="text-sm text-slate-600">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Landing page root ─── */
export function Landing() {
  return (
    <div className="min-h-screen font-sans">
      <Nav />
      <HeroSection />
      <ValueBar />
      <FeaturesSection />
      <HowItWorksSection />
      <ProductPreviewSection />
      <BenefitsSection />
      <UserRolesSection />
      <CTASection />
      <Footer />
    </div>
  );
}

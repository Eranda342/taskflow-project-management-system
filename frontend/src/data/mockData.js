export const USERS = [
  { id: "u1", name: "Alex Morgan", email: "alex.morgan@taskflow.io", role: "project_manager", status: "active", initials: "AM", color: "bg-blue-600", createdAt: "2025-01-10" },
  { id: "u2", name: "Sarah Chen", email: "sarah.chen@taskflow.io", role: "project_manager", status: "active", initials: "SC", color: "bg-violet-600", createdAt: "2025-02-14" },
  { id: "u3", name: "David Kim", email: "david.kim@taskflow.io", role: "team_member", status: "active", initials: "DK", color: "bg-emerald-600", createdAt: "2025-03-01" },
  { id: "u4", name: "James Wilson", email: "james.wilson@taskflow.io", role: "team_member", status: "active", initials: "JW", color: "bg-amber-600", createdAt: "2025-03-15" },
  { id: "u5", name: "Priya Patel", email: "priya.patel@taskflow.io", role: "team_member", status: "active", initials: "PP", color: "bg-pink-600", createdAt: "2025-04-02" },
  { id: "u6", name: "Marcus Lee", email: "marcus.lee@taskflow.io", role: "team_member", status: "inactive", initials: "ML", color: "bg-slate-500", createdAt: "2025-04-20" },
  { id: "u7", name: "Olivia Brown", email: "olivia.brown@taskflow.io", role: "project_manager", status: "active", initials: "OB", color: "bg-teal-600", createdAt: "2025-05-10" },
  { id: "u8", name: "Ryan Torres", email: "ryan.torres@taskflow.io", role: "team_member", status: "active", initials: "RT", color: "bg-orange-500", createdAt: "2025-06-01" },
  { id: "u9", name: "Admin User", email: "admin@taskflow.io", role: "admin", status: "active", initials: "AU", color: "bg-red-600", createdAt: "2024-12-01" },
];

export const PROJECTS = [
  {
    id: "p1",
    name: "Q3 Marketing Campaign",
    description: "Launch new product landing pages and digital ad campaigns for Q3 2026.",
    status: "active",
    ownerId: "u1",
    memberIds: ["u1", "u2", "u3", "u5"],
    startDate: "2026-07-01",
    deadline: "2026-10-12",
    progress: 65,
    tasksTotal: 20,
    tasksCompleted: 13,
  },
  {
    id: "p2",
    name: "Website Redesign",
    description: "Corporate site overhaul — new design system, performance improvements, and CMS migration.",
    status: "review",
    ownerId: "u2",
    memberIds: ["u1", "u2", "u4", "u7"],
    startDate: "2026-05-15",
    deadline: "2026-09-30",
    progress: 90,
    tasksTotal: 35,
    tasksCompleted: 31,
  },
  {
    id: "p3",
    name: "Mobile App MVP",
    description: "Initial React Native release targeting iOS and Android with core feature set.",
    status: "planning",
    ownerId: "u1",
    memberIds: ["u1", "u3", "u4", "u8"],
    startDate: "2026-08-01",
    deadline: "2026-12-01",
    progress: 15,
    tasksTotal: 48,
    tasksCompleted: 7,
  },
  {
    id: "p4",
    name: "Customer Portal",
    description: "Self-service portal for support ticketing and account management.",
    status: "on_hold",
    ownerId: "u1",
    memberIds: ["u1", "u5", "u6"],
    startDate: "2026-04-01",
    deadline: "2026-11-30",
    progress: 40,
    tasksTotal: 22,
    tasksCompleted: 9,
  },
  {
    id: "p5",
    name: "Infrastructure Migration",
    description: "Move all services to AWS — containers, CI/CD, and RDS setup.",
    status: "completed",
    ownerId: "u7",
    memberIds: ["u4", "u7", "u8"],
    startDate: "2026-02-01",
    deadline: "2026-08-15",
    progress: 100,
    tasksTotal: 18,
    tasksCompleted: 18,
  },
  {
    id: "p6",
    name: "Analytics Dashboard",
    description: "Internal analytics platform for business intelligence and reporting.",
    status: "active",
    ownerId: "u2",
    memberIds: ["u2", "u3", "u5", "u8"],
    startDate: "2026-06-15",
    deadline: "2026-11-15",
    progress: 38,
    tasksTotal: 30,
    tasksCompleted: 11,
  },
];

export const TASKS = [
  {
    id: "t1",
    title: "Design system typography updates",
    description: "Update the design token library to reflect new font scale decisions from the brand refresh. Ensure Inter variable font is used throughout.",
    projectId: "p2",
    assigneeId: "u3",
    createdById: "u2",
    status: "todo",
    priority: "medium",
    dueDate: "2026-10-15",
    createdAt: "2026-08-01T09:00:00Z",
    updatedAt: "2026-08-10T14:30:00Z",
    commentsCount: 2,
  },
  {
    id: "t2",
    title: "Update API documentation",
    description: "Document all new endpoints added in v2.4 — authentication, projects, tasks, and notifications.",
    projectId: "p4",
    assigneeId: "u3",
    createdById: "u1",
    status: "todo",
    priority: "low",
    dueDate: "2026-10-18",
    createdAt: "2026-08-05T10:00:00Z",
    updatedAt: "2026-08-05T10:00:00Z",
    commentsCount: 0,
  },
  {
    id: "t3",
    title: "Write test cases for Auth module",
    description: "Cover unit tests and integration tests for all authentication flows including OAuth.",
    projectId: "p3",
    assigneeId: "u4",
    createdById: "u1",
    status: "todo",
    priority: "high",
    dueDate: "2026-10-14",
    createdAt: "2026-08-06T08:00:00Z",
    updatedAt: "2026-08-09T16:00:00Z",
    commentsCount: 0,
  },
  {
    id: "t4",
    title: "Implement OAuth integration",
    description: "Integrate Google and GitHub OAuth using Passport.js. Handle token refresh and session persistence.",
    projectId: "p3",
    assigneeId: "u3",
    createdById: "u1",
    status: "in_progress",
    priority: "urgent",
    dueDate: "2026-10-12",
    createdAt: "2026-07-28T09:00:00Z",
    updatedAt: "2026-08-11T11:00:00Z",
    commentsCount: 5,
  },
  {
    id: "t5",
    title: "Hero section animations",
    description: "Add CSS keyframe animations for hero section elements. Use Intersection Observer for scroll-triggered effects.",
    projectId: "p2",
    assigneeId: "u3",
    createdById: "u2",
    status: "in_progress",
    priority: "medium",
    dueDate: "2026-10-16",
    createdAt: "2026-08-03T13:00:00Z",
    updatedAt: "2026-08-12T09:00:00Z",
    commentsCount: 1,
  },
  {
    id: "t6",
    title: "Homepage final copy review",
    description: "Review and approve final copy for all homepage sections with stakeholders before dev handoff.",
    projectId: "p2",
    assigneeId: "u5",
    createdById: "u2",
    status: "review",
    priority: "high",
    dueDate: "2026-10-10",
    createdAt: "2026-07-20T10:00:00Z",
    updatedAt: "2026-08-11T15:00:00Z",
    commentsCount: 8,
  },
  {
    id: "t7",
    title: "Setup CI/CD pipeline",
    description: "Configure GitHub Actions workflows for build, test, and deployment to staging and production.",
    projectId: "p5",
    assigneeId: "u4",
    createdById: "u7",
    status: "completed",
    priority: "high",
    dueDate: "2026-08-01",
    createdAt: "2026-07-01T09:00:00Z",
    updatedAt: "2026-08-01T17:00:00Z",
    commentsCount: 3,
  },
  {
    id: "t8",
    title: "Provision staging database",
    description: "Set up RDS PostgreSQL instance for staging environment with proper IAM roles and backup policies.",
    projectId: "p5",
    assigneeId: "u8",
    createdById: "u7",
    status: "completed",
    priority: "medium",
    dueDate: "2026-08-05",
    createdAt: "2026-07-10T09:00:00Z",
    updatedAt: "2026-08-05T16:00:00Z",
    commentsCount: 1,
  },
  {
    id: "t9",
    title: "Define Q3 ad creative specs",
    description: "Compile creative specs for all digital ad placements — Google Display, Meta, and LinkedIn.",
    projectId: "p1",
    assigneeId: "u5",
    createdById: "u1",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-09-05",
    createdAt: "2026-08-01T09:00:00Z",
    updatedAt: "2026-08-10T11:00:00Z",
    commentsCount: 2,
  },
  {
    id: "t10",
    title: "Landing page A/B test setup",
    description: "Configure A/B testing variants for the new product landing page using PostHog.",
    projectId: "p1",
    assigneeId: "u3",
    createdById: "u1",
    status: "todo",
    priority: "medium",
    dueDate: "2026-09-20",
    createdAt: "2026-08-08T10:00:00Z",
    updatedAt: "2026-08-08T10:00:00Z",
    commentsCount: 0,
  },
];

export const COMMENTS = [
  {
    id: "c1",
    taskId: "t4",
    authorId: "u1",
    content: "David, can you share your progress on the Google OAuth flow? We're running close to deadline.",
    createdAt: "2026-08-09T10:15:00Z",
    updatedAt: "2026-08-09T10:15:00Z",
  },
  {
    id: "c2",
    taskId: "t4",
    authorId: "u3",
    content: "Google OAuth callback is working in dev. Still debugging token refresh expiry on the GitHub side — should be resolved by EOD tomorrow.",
    createdAt: "2026-08-09T11:30:00Z",
    updatedAt: "2026-08-09T11:30:00Z",
  },
  {
    id: "c3",
    taskId: "t4",
    authorId: "u2",
    content: "FYI — I've updated the Passport.js version in package.json to 0.7.0 which fixes a known session bug. Please pull latest.",
    createdAt: "2026-08-10T09:00:00Z",
    updatedAt: "2026-08-10T09:00:00Z",
  },
  {
    id: "c4",
    taskId: "t4",
    authorId: "u3",
    content: "Pulled latest. Token refresh is now working correctly for both providers. Moving to final testing.",
    createdAt: "2026-08-11T14:45:00Z",
    updatedAt: "2026-08-11T14:45:00Z",
  },
  {
    id: "c5",
    taskId: "t4",
    authorId: "u1",
    content: "Great progress! Once tests pass, please open a PR for review.",
    createdAt: "2026-08-11T16:00:00Z",
    updatedAt: "2026-08-11T16:00:00Z",
  },
  {
    id: "c6",
    taskId: "t6",
    authorId: "u2",
    content: "Copy has been submitted for stakeholder approval. Waiting on sign-off from marketing director.",
    createdAt: "2026-08-05T10:00:00Z",
    updatedAt: "2026-08-05T10:00:00Z",
  },
  {
    id: "c7",
    taskId: "t1",
    authorId: "u2",
    content: "Please ensure the new font scale uses the Inter variable font — static weights are being deprecated.",
    createdAt: "2026-08-08T13:00:00Z",
    updatedAt: "2026-08-08T13:00:00Z",
  },
  {
    id: "c8",
    taskId: "t1",
    authorId: "u3",
    content: "Understood. I'll update the token file and push a demo link by Friday.",
    createdAt: "2026-08-09T09:30:00Z",
    updatedAt: "2026-08-09T09:30:00Z",
  },
];

export const NOTIFICATIONS = [
  {
    id: "n1",
    type: "task_assigned",
    message: "Alex Morgan assigned you to \"Implement OAuth integration\"",
    targetId: "t4",
    targetType: "task",
    isRead: false,
    createdAt: "2026-08-11T16:00:00Z",
  },
  {
    id: "n2",
    type: "comment_added",
    message: "Sarah Chen commented on \"Design system typography updates\"",
    targetId: "t1",
    targetType: "task",
    isRead: false,
    createdAt: "2026-08-09T13:00:00Z",
  },
  {
    id: "n3",
    type: "task_updated",
    message: "\"Homepage final copy review\" status changed to Review",
    targetId: "t6",
    targetType: "task",
    isRead: false,
    createdAt: "2026-08-08T15:30:00Z",
  },
  {
    id: "n4",
    type: "member_added",
    message: "You were added to project \"Mobile App MVP\"",
    targetId: "p3",
    targetType: "project",
    isRead: true,
    createdAt: "2026-08-07T10:00:00Z",
  },
  {
    id: "n5",
    type: "comment_added",
    message: "David Kim replied on \"Implement OAuth integration\"",
    targetId: "t4",
    targetType: "task",
    isRead: true,
    createdAt: "2026-08-09T11:30:00Z",
  },
  {
    id: "n6",
    type: "project_updated",
    message: "\"Website Redesign\" progress updated to 90%",
    targetId: "p2",
    targetType: "project",
    isRead: true,
    createdAt: "2026-08-06T09:00:00Z",
  },
  {
    id: "n7",
    type: "task_assigned",
    message: "Olivia Brown assigned you to \"Landing page A/B test setup\"",
    targetId: "t10",
    targetType: "task",
    isRead: true,
    createdAt: "2026-08-08T10:00:00Z",
  },
];

export function getUser(id) {
  return USERS.find((u) => u.id === id);
}

export function getProject(id) {
  return PROJECTS.find((p) => p.id === id);
}

export function getProjectTasks(projectId) {
  return TASKS.filter((t) => t.projectId === projectId);
}

export function getTaskComments(taskId) {
  return COMMENTS.filter((c) => c.taskId === taskId);
}

export function getStatusLabel(status) {
  const map = {
    todo: "To Do",
    in_progress: "In Progress",
    review: "Review",
    completed: "Completed",
    planning: "Planning",
    active: "Active",
    on_hold: "On Hold",
  };
  return map[status] ?? status;
}

export function getPriorityLabel(priority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function getRoleLabel(role) {
  const map = {
    admin: "Admin",
    project_manager: "Project Manager",
    team_member: "Team Member",
  };
  return map[role] ?? role;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function timeAgo(dateStr) {
  const now = new Date("2026-08-12T12:00:00Z");
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

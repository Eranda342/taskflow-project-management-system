Design a complete modern SaaS web application UI called "TaskFlow" — a project management and team collaboration platform.

IMPORTANT:
This is a production-quality software product, not a marketing landing page.

The design must be:
- Modern
- Professional
- Clean
- Minimal
- Highly usable
- Responsive
- Suitable for a university final-year software project and professional portfolio
- Consistent across every page
- Designed with reusable components and a coherent design system

==================================================
BRAND
==================================================

Product name:
TaskFlow

Product type:
Project Management & Team Collaboration Platform

Primary brand color:
#4F46E5 — Deep Indigo

Primary hover:
#4338CA

Secondary:
#64748B

Main background:
#F8FAFC

Card background:
#FFFFFF

Main text:
#0F172A

Secondary text:
#64748B

Borders:
#E2E8F0

Success:
#16A34A

Warning:
#D97706

Error:
#DC2626

Info:
#2563EB

Sidebar:
#0F172A

Status colors:
To Do: #64748B
In Progress: #2563EB
Review: #D97706
Completed: #16A34A
Cancelled: #DC2626
On Hold: #8B5CF6

Use a restrained color system.
Do not use excessive gradients, neon colors, or unnecessary decorative elements.

==================================================
TYPOGRAPHY
==================================================

Use a modern UI font such as Inter.

Typography should have clear hierarchy:

Large page heading:
28–32px, semibold/bold

Section heading:
18–22px, semibold

Body:
14–16px

Small metadata:
12–13px

Use generous spacing and strong visual hierarchy.

==================================================
DESIGN SYSTEM
==================================================

Create reusable components for:

- Buttons
- Inputs
- Select fields
- Search bars
- Dropdowns
- Modal dialogs
- Confirmation dialogs
- Cards
- Badges
- Status badges
- Priority badges
- Avatars
- Avatar groups
- Tables
- Pagination
- Tabs
- Breadcrumbs
- Tooltips
- Toast notifications
- Empty states
- Loading states
- Error states
- Skeleton loaders
- Sidebar navigation
- Top navigation
- Notification panel
- User profile menu

Use consistent:
- Border radius
- Shadows
- Spacing
- Icon sizes
- Button heights
- Input heights
- Card styles

Avoid excessive rounded/pill-shaped UI.
Use moderate 8–12px corner radius for cards and controls.

==================================================
APPLICATION LAYOUT
==================================================

Desktop layout:

Left:
Fixed sidebar approximately 240–260px wide.

Center:
Main application content.

Top:
Application header/navigation bar.

Sidebar should contain:

TaskFlow logo

Navigation:

Dashboard
Projects
My Tasks
Notifications

For administrators additionally:

Users
Admin Dashboard
Analytics

Bottom of sidebar:

User avatar
User name
User role
Settings
Logout

The sidebar should have:
- Clear active navigation state
- Hover state
- Icons
- Good spacing
- Strong accessibility contrast

==================================================
AUTHENTICATION
==================================================

Create:

1. Login page
2. Registration page
3. Authentication loading state
4. Authentication error state

Login page:

TaskFlow branding on one side and login form on the other.

Fields:

Email
Password

Actions:

Login
Forgot password

Registration:

Name
Email
Password
Confirm password

Role should NOT be freely selectable by normal users during registration if the backend controls roles.

Include:
- Validation messages
- Loading button state
- Error state
- Success state

==================================================
DASHBOARD
==================================================

Create role-specific dashboards.

PROJECT MANAGER DASHBOARD:

Header:
"Good morning, [Name]"
"Here's what's happening with your projects."

Summary cards:

Total Projects
Active Projects
Total Tasks
Overdue Tasks

Task overview:

To Do
In Progress
Review
Completed

Project overview:

Recent Projects

Columns:
Project
Status
Progress
Members
Deadline
Actions

Upcoming deadlines:

Task
Project
Priority
Due date
Status

Recent activity:

Activity feed showing:
- Project created
- Member added
- Task assigned
- Task completed
- Comment added

==================================================
TEAM MEMBER DASHBOARD
==================================================

Header:

"Good morning, [Name]"

Summary cards:

My Projects
My Tasks
In Progress
Overdue

"My Tasks" section:

Task
Project
Priority
Status
Due Date

Upcoming deadlines.

Recent projects.

Notifications/activity.

The team member dashboard must only visually expose information relevant to the current user's projects and assigned tasks.

==================================================
ADMIN DASHBOARD
==================================================

Admin dashboard should look more analytical.

Summary cards:

Total Users
Active Users
Total Projects
Total Tasks

Analytics:

Users by Role
Users by Status
Projects by Status
Tasks by Status
Tasks by Priority

Use clean charts:

- Donut charts
- Bar charts
- Line/area chart for recent activity

Recent users table.

Recent projects table.

Keep charts clean and readable.

==================================================
PROJECTS
==================================================

Create Projects page.

Header:

Projects
"Manage and collaborate on your projects."

Primary button:

+ Create Project

Include:

Search projects
Status filter
Sort
Pagination

Project cards/table should show:

Project name
Description
Owner
Members
Status
Start date
Deadline
Updated date

Statuses:

Planning
Active
On Hold
Completed
Cancelled

Provide:

View Project
Edit Project
Delete Project

Use confirmation modal for destructive actions.

==================================================
CREATE PROJECT
==================================================

Create project form:

Project name
Description
Start date
Deadline
Status

Show validation messages.

Include:

Cancel
Create Project

==================================================
PROJECT DETAILS
==================================================

Create a detailed project workspace.

Header:

Project name
Status
Description
Owner
Members
Deadline

Actions:

Edit Project
Delete Project
Add Member

Tabs:

Overview
Tasks
Members
Activity

Overview:

Project statistics
Task progress
Upcoming deadlines
Recent activity

Tasks:

Task table/list with:

Task
Assignee
Priority
Status
Due Date
Actions

==================================================
PROJECT MEMBERS
==================================================

Members page:

Member avatar
Name
Email
Role
Status
Joined date

Actions:

Add Member
Remove Member

Add Member modal:

Search available users.

Show:
Name
Email
Role

Include confirmation before removing a member.

==================================================
TASK MANAGEMENT
==================================================

Create My Tasks page.

Include:

All
To Do
In Progress
Review
Completed

Task list/table:

Task
Project
Assignee
Priority
Status
Due Date

Allow:

Search
Status filter
Priority filter
Project filter
Sort
Pagination

==================================================
TASK DETAILS
==================================================

Task details should display:

Task title
Description
Project
Assignee
Created by
Priority
Status
Due date
Created date
Updated date

Actions:

Edit
Delete
Change status
Assign task

Comments section:

Comment input
Post comment

Existing comments:

Avatar
Author
Message
Timestamp
Edit
Delete

Show real-time collaboration indicators where appropriate.

==================================================
NOTIFICATIONS
==================================================

Create notification center.

Notification types include:

Project member added
Project member removed
Task assigned
Task status changed
Comments/activity

Display:

Unread indicator
Notification icon
Title
Description
Timestamp
Read/unread state

Actions:

Mark as read
Mark all as read

Use a notification dropdown in the global header as well as a full Notifications page.

==================================================
ADMIN USER MANAGEMENT
==================================================

Admin-only page.

Users table:

Avatar
Name
Email
Role
Status
Created date
Actions

Filters:

Role
Status
Search

Admin actions:

Change role
Activate user
Deactivate user

Prevent dangerous actions through confirmation dialogs.

==================================================
ADMIN ANALYTICS
==================================================

Create a dedicated analytics page.

Sections:

User Analytics
Project Analytics
Task Analytics
Activity Analytics

Charts should visualize:

Users by role
Users by status
Projects by status
Tasks by status
Tasks by priority
7-day activity

Use the TaskFlow color palette consistently.

==================================================
REAL-TIME UI
==================================================

The backend uses Socket.IO.

Design UI states for real-time events:

- Task created
- Task updated
- Task assigned
- Task status changed
- New comment
- Comment updated
- Comment deleted
- Project deleted
- Member added
- Member removed
- New notification

When real-time updates occur:

- Update the UI without requiring a page refresh
- Show subtle toast notifications where appropriate
- Update notification badge
- Update task/project lists
- Avoid disruptive modal dialogs for normal realtime updates

==================================================
LOADING / ERROR / EMPTY STATES
==================================================

Every data-driven page must include:

Loading state
Skeleton loading
Empty state
Error state
Retry action

Examples:

"No projects yet"
"No tasks assigned to you"
"No notifications"
"No upcoming deadlines"

Do not leave blank white areas when there is no data.

==================================================
RESPONSIVE DESIGN
==================================================

Create responsive layouts for:

Desktop
Tablet
Mobile

Desktop:
Sidebar visible.

Tablet:
Condensed sidebar.

Mobile:
Sidebar becomes a drawer.

Tables should transform into cards or horizontally scroll when necessary.

Dashboard cards should stack naturally on smaller screens.

==================================================
ACCESSIBILITY
==================================================

Use:

Good color contrast
Visible focus states
Clear labels
Keyboard-friendly controls
Meaningful button labels
Accessible status indicators

Do not rely only on color to communicate status.

==================================================
VISUAL STYLE
==================================================

Overall aesthetic:

Professional SaaS
Modern project-management application
Clean enterprise interface
Subtle shadows
White cards
Light gray background
Deep navy sidebar
Indigo primary actions
Clear typography
Minimal visual noise

Reference the usability principles of modern products such as:
Linear
Jira
Asana
ClickUp
Notion

However, do NOT copy their designs.

Create an original TaskFlow visual identity.

==================================================
IMPORTANT UX RULES
==================================================

Do not overcrowd dashboards.

Prioritize information hierarchy.

Primary actions should be visually obvious.

Destructive actions should use warning/error styling and confirmation dialogs.

Use consistent spacing.

Keep navigation predictable.

Keep tables readable.

Use realistic sample data to demonstrate the UI.

Create a complete cohesive design system rather than designing each page independently.

==================================================

FINAL DELIVERABLE
==================================================

Create a complete TaskFlow application UI covering:

1. Login
2. Registration
3. Dashboard — Project Manager
4. Dashboard — Team Member
5. Dashboard — Admin
6. Projects
7. Create Project
8. Project Details
9. Project Members
10. My Tasks
11. Task Details
12. Notifications
13. Admin Users
14. Admin Analytics
15. Settings/Profile
16. Modals
17. Toasts
18. Loading states
19. Empty states
20. Error states
21. Responsive mobile layouts

All screens must share the same design system and component library.
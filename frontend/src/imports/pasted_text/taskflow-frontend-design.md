Design a complete, production-ready web application frontend for a modern project management platform called:

TASKFLOW

TaskFlow is a collaborative project management and task tracking system for teams.

IMPORTANT:
Create the ENTIRE website/frontend design, not just a landing page.

The backend/API is already implemented, so the frontend must be designed around a real authenticated project-management application with role-based access.

The application has 3 user roles:

1. ADMIN
2. PROJECT MANAGER
3. TEAM MEMBER

The design must support desktop, tablet, and responsive mobile layouts.

==================================================
1. DESIGN DIRECTION
==================================================

Create a modern SaaS-style project management interface inspired by products such as Linear, Jira, ClickUp, Asana and modern enterprise dashboards.

The interface should feel:

- Professional
- Clean
- Modern
- Technical
- Reliable
- Minimal
- Productive
- Easy to navigate
- Suitable for a real software product

Avoid excessive gradients, excessive rounded cards, cartoon illustrations, unnecessary decoration, or overly colorful UI.

Prioritize usability and information density.

Use consistent spacing, typography, icons, components, states and interaction patterns throughout the entire design.

==================================================
2. COLOR PALETTE
==================================================

Use this exact design system:

PRIMARY:
- Primary: #2563EB
- Primary Hover: #1D4ED8
- Primary Light: #DBEAFE
- Primary Dark: #1E40AF

SECONDARY:
- Secondary: #0F172A
- Secondary Light: #334155

BACKGROUND:
- Main Background: #F8FAFC
- Surface: #FFFFFF
- Secondary Surface: #F1F5F9

TEXT:
- Primary Text: #0F172A
- Secondary Text: #475569
- Muted Text: #64748B
- Disabled Text: #94A3B8

BORDERS:
- Border: #E2E8F0
- Strong Border: #CBD5E1

STATUS COLORS:
- Success: #16A34A
- Success Background: #DCFCE7

- Warning: #D97706
- Warning Background: #FEF3C7

- Error: #DC2626
- Error Background: #FEE2E2

- Info: #0284C7
- Info Background: #E0F2FE

TASK STATUS COLORS:
- To Do: #64748B
- In Progress: #2563EB
- Review: #D97706
- Completed: #16A34A

PRIORITY:
- Low: #64748B
- Medium: #2563EB
- High: #D97706
- Urgent: #DC2626

Use color primarily to communicate state and hierarchy.

==================================================
3. TYPOGRAPHY
==================================================

Use:

Primary font:
Inter

Alternative:
Manrope

Typography should have a clear hierarchy.

Suggested:

Display: 32–40px
Page heading: 24–30px
Section heading: 18–20px
Body: 14–16px
Small text: 12–13px

Use semibold/bold for important headings and medium weight for labels.

==================================================
4. GLOBAL APPLICATION LAYOUT
==================================================

Create a reusable authenticated application layout.

Desktop:

LEFT SIDEBAR
- TaskFlow logo
- Dashboard
- Projects
- My Tasks
- Notifications
- Team / Users where appropriate
- Admin section for administrators
- Settings
- User profile section
- Logout

MAIN CONTENT
- Top navigation/header
- Breadcrumb where appropriate
- Page title
- Page actions
- Main content

TOP HEADER:
- Search
- Notifications icon
- User avatar
- User name
- Role indicator
- Profile menu

Sidebar should be collapsible.

Mobile:
- Bottom navigation or hamburger navigation
- Responsive header
- Sidebar becomes drawer
- Tables become responsive cards/lists
- Preserve all functionality

==================================================
5. AUTHENTICATION SCREENS
==================================================

Create:

A. Login
- Email
- Password
- Show/hide password
- Remember me
- Login button
- Forgot password
- Register link
- Validation states
- Loading state
- Error state

B. Registration
- Full name
- Email
- Password
- Confirm password
- Register button
- Validation
- Password strength indicator
- Login link

C. Authentication error states
- Invalid credentials
- Session expired
- Unauthorized
- Account inactive

==================================================
6. DASHBOARD
==================================================

Create role-specific dashboards.

------------------------------------
PROJECT MANAGER DASHBOARD
------------------------------------

Header:
"Good morning, [Name]"

Summary cards:

- Total Projects
- Active Projects
- Total Tasks
- My Tasks
- Overdue Tasks
- Unread Notifications

Project section:
- Recent Projects
- Project name
- Status
- Deadline
- Progress
- Members

Task section:
- Recent Tasks
- Task title
- Project
- Assignee
- Priority
- Status
- Due date

Upcoming deadlines:
- Timeline/list of upcoming tasks

Charts:
- Task status distribution
- Project progress
- Task priority distribution

Quick actions:
- Create Project
- Create Task

------------------------------------
TEAM MEMBER DASHBOARD
------------------------------------

Summary:

- My Projects
- Active Projects
- My Tasks
- In Progress
- Completed
- Overdue

Sections:

- My Tasks
- Upcoming Deadlines
- Recent Projects
- Notifications

Provide clear task priorities and status indicators.

------------------------------------
ADMIN DASHBOARD
------------------------------------

Platform-level dashboard.

Summary:

- Total Users
- Active Users
- Total Projects
- Total Tasks
- Total Comments
- Notifications

Analytics:

Users by Role:
- Admin
- Project Manager
- Team Member

Users by Status:
- Active
- Inactive

Projects by Status:
- Planning
- Active
- On Hold
- Completed
- Cancelled

Tasks by Status:
- To Do
- In Progress
- Review
- Completed

Tasks by Priority:
- Low
- Medium
- High
- Urgent

Recent activity.

Use professional charts.

==================================================
7. PROJECTS
==================================================

Create:

A. Project list page

Features:
- Search
- Filter
- Sort
- Create Project
- Project cards/table
- Status
- Owner
- Members
- Deadline
- Updated date

Project statuses:
- Planning
- Active
- On Hold
- Completed
- Cancelled

B. Create Project modal/page

Fields:
- Project name
- Description
- Start date
- Deadline
- Status

C. Edit Project

D. Project details

Project header:
- Project name
- Description
- Status
- Owner
- Members
- Deadline

Tabs:

- Overview
- Tasks
- Members
- Activity

Project overview:
- Progress
- Task statistics
- Upcoming deadlines
- Recent activity

==================================================
8. PROJECT MEMBERS
==================================================

Create project member management UI.

Display:
- Member avatar
- Name
- Email
- Role
- Status
- Joined date

Actions:
- Add member
- Remove member

Add member modal:
- Search users
- User selection
- Confirm

States:
- Already member
- Inactive user
- No candidates
- Unauthorized action

==================================================
9. TASK MANAGEMENT
==================================================

Create a complete task management interface.

Task list/table:

Columns:
- Task
- Project
- Assignee
- Status
- Priority
- Due date
- Updated

Filters:
- Status
- Priority
- Assignee
- Project
- Due date

Search.

Create Task.

Task statuses:

TO DO
IN PROGRESS
REVIEW
COMPLETED

Priorities:

LOW
MEDIUM
HIGH
URGENT

Use badges/chips with the defined colors.

==================================================
10. TASK DETAILS
==================================================

Create a detailed task page/modal.

Display:

- Task title
- Description
- Project
- Assignee
- Created by
- Status
- Priority
- Due date
- Created date
- Updated date

Actions:

- Edit
- Assign
- Change status
- Change priority
- Delete

Activity section.

Comments section:

- Comment list
- Author
- Avatar
- Timestamp
- Edit comment
- Delete comment
- Add comment

==================================================
11. MY TASKS
==================================================

Create a dedicated "My Tasks" page.

Sections:

- All
- To Do
- In Progress
- Review
- Completed
- Overdue

Provide:
- Search
- Filters
- Sorting
- Task cards/table
- Priority indicators
- Due date indicators

==================================================
12. NOTIFICATIONS
==================================================

Create a notification center.

Notification types include:

- Project member added
- Project member removed
- Task assigned
- Task updated
- Comment activity
- Project activity

Each notification should show:

- Icon
- Message
- Time
- Read/unread state

Actions:
- Mark as read
- Mark all as read

Unread notifications should be visually distinguishable.

==================================================
13. USER MANAGEMENT — ADMIN
==================================================

Create admin user management.

Table:

- Avatar
- Name
- Email
- Role
- Status
- Created date
- Actions

Filters:
- Role
- Status
- Search

Actions:
- View
- Edit role
- Activate
- Deactivate

Roles:
- Admin
- Project Manager
- Team Member

Create confirmation dialogs for destructive actions.

==================================================
14. ADMIN PROJECT MANAGEMENT
==================================================

Admin should be able to view platform projects.

Display:

- Project name
- Owner
- Status
- Members
- Tasks
- Created date
- Deadline

Admin actions should be visually separated from normal user actions.

==================================================
15. ADMIN ANALYTICS
==================================================

Create a professional analytics page.

Charts:

1. Users by Role
2. Users by Status
3. Projects by Status
4. Tasks by Status
5. Tasks by Priority
6. Recent Activity

Use:
- Donut charts
- Bar charts
- Line charts
- Stat cards

Charts must remain readable and accessible.

==================================================
16. PROFILE
==================================================

Create profile page.

Display:

- Profile image
- Full name
- Email
- Role
- Account status

Sections:

Personal information
Security
Account information

Allow appropriate profile editing.

==================================================
17. SETTINGS
==================================================

Create settings page.

Sections:

- Profile
- Account
- Notifications
- Security
- Appearance

Include:
- Notification preferences
- Password change
- Theme preference

==================================================
18. ERROR & EMPTY STATES
==================================================

Design proper UI states for:

- 404
- 401 Unauthorized
- 403 Forbidden
- 400 Validation Error
- 500 Server Error
- Network error
- Empty project list
- Empty task list
- No notifications
- No search results
- No team members

Do NOT use generic browser alerts.

Use professional inline error messages, toast notifications, modals and empty-state components.

==================================================
19. LOADING STATES
==================================================

Create:

- Skeleton loaders
- Button loading states
- Table loading
- Dashboard loading
- Project loading
- Task loading

Avoid blank screens during API requests.

==================================================
20. MODALS & CONFIRMATION DIALOGS
==================================================

Create reusable modal components for:

- Create Project
- Edit Project
- Delete Project
- Add Member
- Remove Member
- Create Task
- Edit Task
- Delete Task
- Assign Task
- Change User Role
- Deactivate User

Destructive actions must require confirmation.

==================================================
21. TOAST NOTIFICATIONS
==================================================

Create reusable toast styles:

Success
Error
Warning
Info

Examples:

"Project created successfully"
"Task assigned successfully"
"Member removed successfully"
"Failed to update task"

==================================================
22. REALTIME UI
==================================================

The backend uses Socket.IO.

Design UI states for realtime events:

- New task appears without refresh
- Task status updates
- Task assignment updates
- New comments
- Edited comments
- Deleted comments
- Project member added
- Project member removed
- New notifications

Show subtle realtime indicators where useful.

Do not overuse animations.

==================================================
23. RESPONSIVE DESIGN
==================================================

Create responsive layouts for:

Desktop:
1440px
1280px

Tablet:
1024px
768px

Mobile:
390px
375px

Ensure:
- Tables adapt to mobile
- Sidebar becomes drawer
- Cards stack
- Modals fit screen
- Forms remain usable
- Charts resize
- Navigation remains accessible

==================================================
24. ACCESSIBILITY
==================================================

Follow WCAG-friendly design principles.

Ensure:
- Sufficient contrast
- Visible focus states
- Clear labels
- Accessible buttons
- Icons accompanied by tooltips where necessary
- Do not rely only on color to communicate status

==================================================
25. COMPONENT DESIGN SYSTEM
==================================================

Create reusable Figma components for:

- Buttons
- Inputs
- Selects
- Search
- Dropdowns
- Badges
- Status indicators
- Priority indicators
- Avatars
- Cards
- Tables
- Tabs
- Modals
- Toasts
- Tooltips
- Pagination
- Breadcrumbs
- Sidebar
- Header
- Charts
- Empty states
- Skeleton loaders
- Confirmation dialogs

Create component variants for:

Default
Hover
Active
Focus
Disabled
Loading
Error
Success

==================================================
26. FIGMA FILE STRUCTURE
==================================================

Organize the Figma file into pages:

01 — Design System
02 — Authentication
03 — Shared Components
04 — Project Manager
05 — Team Member
06 — Admin
07 — Project Management
08 — Task Management
09 — Notifications
10 — Profile & Settings
11 — Responsive / Mobile
12 — Prototype / User Flows

Use Auto Layout extensively.

Use reusable components and variants.

Use consistent spacing based on an 8px spacing system.

==================================================
27. PROTOTYPE FLOWS
==================================================

Create clickable prototype flows for:

FLOW 1:
Login → Project Manager Dashboard → Projects → Project Details → Tasks → Task Details

FLOW 2:
Login → Team Member Dashboard → My Tasks → Task Details → Comment

FLOW 3:
Login → Admin Dashboard → Users → User Details

FLOW 4:
Project Manager → Project → Add Member → Member Added

FLOW 5:
Project Manager → Task → Assign Team Member → Notification

FLOW 6:
Team Member → Notification → Task Details

FLOW 7:
Admin → Analytics → Users → Projects

==================================================
28. IMPORTANT PRODUCT RULES
==================================================

Respect role-based access in the UI.

PROJECT MANAGER:
- Manage owned projects
- Access projects where they are members
- Create/manage appropriate tasks
- Manage project members according to permissions

TEAM MEMBER:
- View assigned/member projects
- View and work on assigned tasks
- Comment on tasks
- Cannot access admin functionality

ADMIN:
- Platform-wide visibility
- User management
- Platform analytics
- Administrative project management

Do not expose admin navigation to normal users.

==================================================
29. FINAL DESIGN QUALITY
==================================================

The final result should look like a real production SaaS application rather than a student dashboard.

Prioritize:

1. UX clarity
2. Consistency
3. Accessibility
4. Responsive design
5. Role-based navigation
6. Reusable components
7. Professional visual hierarchy
8. Realistic data
9. Clear interaction states
10. Developer-friendly component structure

Create the COMPLETE TaskFlow frontend design with all major pages, components, states, responsive layouts and prototype flows.

Do not stop after creating only the dashboard.

Generate the complete application UI.
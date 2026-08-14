Design a complete, production-quality web application UI for a project management system called "TaskFlow".

TaskFlow is a modern project management and team collaboration platform. The backend is already implemented using Node.js, Express.js, MongoDB, JWT authentication, REST APIs, and Socket.IO real-time communication. The frontend will be implemented in React.

IMPORTANT:
Do not invent unrelated features or change the application's core functionality. Design the UI around the requirements and roles described below.

==================================================
PRODUCT
==================================================

Product name: TaskFlow

Purpose:
TaskFlow allows organizations and teams to create and manage projects, assign tasks, collaborate through comments, receive notifications, monitor project progress, and manage users.

The application has three roles:

1. Administrator
2. Project Manager
3. Team Member

The UI must adapt according to the authenticated user's role.

==================================================
DESIGN DIRECTION
==================================================

Create a modern SaaS project-management interface.

Design style:
- Professional
- Clean
- Modern
- Minimal but feature-rich
- Suitable for a university final-year software engineering project
- Production-quality UI
- Strong visual hierarchy
- Excellent usability
- Responsive
- Desktop-first but also support tablet and mobile layouts

Use a professional technology/SaaS aesthetic similar in quality to modern project-management platforms, but DO NOT copy the visual design of any existing product.

Use:
- Clean cards
- Subtle borders
- Moderate corner radius
- Clear typography
- Consistent spacing
- Professional icons
- Accessible contrast
- Clear status indicators
- Data-dense but uncluttered layouts

Create a coherent design system with reusable components and styles.

==================================================
COLOR SYSTEM
==================================================

Use a professional modern color palette.

Primary:
- Deep blue / indigo

Supporting colors:
- Green for success/completed
- Amber/orange for warnings
- Red for errors/overdue/destructive actions
- Neutral gray scale for backgrounds, borders and secondary text

Do not overuse colors.

Status colors should be consistent throughout the application.

==================================================
TYPOGRAPHY
==================================================

Use a modern sans-serif typeface.

Create a clear hierarchy for:
- Page titles
- Section headings
- Card titles
- Body text
- Labels
- Metadata
- Buttons
- Table text

Prioritize readability.

==================================================
GLOBAL APPLICATION LAYOUT
==================================================

Create a reusable application shell consisting of:

LEFT SIDEBAR:
- TaskFlow logo
- Dashboard
- Projects
- My Tasks
- Notifications
- Profile
- Admin section when applicable

BOTTOM/LOWER SIDEBAR:
- User avatar
- User name
- User role
- Settings
- Logout

TOP BAR:
- Page title/breadcrumb
- Search where appropriate
- Notification icon with unread badge
- User profile/avatar
- Optional contextual actions

The sidebar should support:
- Expanded desktop state
- Collapsed desktop state
- Mobile drawer state

==================================================
AUTHENTICATION SCREENS
==================================================

Create:

1. Login page
   - TaskFlow logo
   - Email
   - Password
   - Show/hide password
   - Login button
   - Validation/error states
   - Loading state

2. Registration page
   - Name
   - Email
   - Password
   - Confirm password
   - Register button
   - Validation states
   - Loading state

3. Authentication error states
   - Invalid credentials
   - Session expired
   - Unauthorized access

==================================================
PROJECT MANAGER DASHBOARD
==================================================

Create a dedicated Project Manager dashboard.

Top summary cards:

Projects:
- Total accessible projects
- Owned projects
- Active projects
- Completed projects

Tasks:
- Total accessible tasks
- Assigned to me
- To Do
- In Progress
- Review
- Completed
- Overdue

Notifications:
- Unread notifications

Main dashboard sections:

1. Recent Projects
   Display up to 5 recent projects.

2. Recent Tasks
   Display up to 5 recent accessible tasks.

3. Upcoming Deadlines
   Display upcoming non-completed tasks sorted by due date.

4. Project progress/status visualization.

5. Task status distribution.

Use charts where useful, but do not make the dashboard unnecessarily complicated.

==================================================
TEAM MEMBER DASHBOARD
==================================================

Create a Team Member dashboard.

Summary cards:
- Total projects
- Active projects
- Completed projects
- My total tasks
- To Do
- In Progress
- Review
- Completed
- Overdue
- Unread notifications

Main sections:
- My Recent Tasks
- Upcoming Deadlines
- My Projects
- Task progress/status

Team members should only see information relevant to projects they belong to and tasks assigned to them.

==================================================
ADMIN DASHBOARD
==================================================

Create a platform-wide Admin dashboard.

Summary cards:
- Total Users
- Active Users
- Inactive Users
- Total Projects
- Active Projects
- Completed Projects
- Total Tasks
- Completed Tasks
- Unread Notifications

Analytics sections:

1. Users by Role
   - Admin
   - Project Manager
   - Team Member

2. Users by Status
   - Active
   - Inactive

3. Projects by Status
   - Planning
   - Active
   - On Hold
   - Completed
   - Cancelled

4. Tasks by Status
   - To Do
   - In Progress
   - Review
   - Completed

5. Tasks by Priority
   - Low
   - Medium
   - High
   - Urgent

6. Recent Activity
   - Users created
   - Projects created
   - Tasks created
   - Comments created
   - Last 7 days

Use appropriate charts and visualizations.

==================================================
PROJECTS
==================================================

Create a Projects page.

Features shown in UI:

- Project list
- Search
- Filters
- Status filters
- Create Project button
- Project cards/table
- Project name
- Description
- Owner
- Members
- Status
- Start date
- Deadline
- Updated date
- Progress

Project statuses:
- Planning
- Active
- On Hold
- Completed
- Cancelled

Create:
- Empty state
- Loading state
- Error state

==================================================
PROJECT DETAILS
==================================================

Create a detailed Project page.

Header:
- Project name
- Description
- Status
- Owner
- Deadline
- Actions

Sections/tabs:

1. Overview
2. Tasks
3. Members
4. Activity

Overview:
- Project information
- Progress
- Task statistics
- Upcoming deadlines

Tasks:
- Project task list/board

Members:
- Member avatars
- Names
- Roles
- Add member
- Remove member

Activity:
- Project activity/events

==================================================
TASK MANAGEMENT
==================================================

Create a modern task-management interface.

Support both:

1. List view
2. Kanban board view

Kanban columns:

- To Do
- In Progress
- Review
- Completed

Task cards should show:
- Task title
- Description preview
- Priority
- Assignee
- Due date
- Project
- Comments count
- Overdue indicator where applicable

Priority levels:
- Low
- Medium
- High
- Urgent

Create:
- Create task modal
- Edit task modal
- Task details panel/page
- Delete confirmation
- Assignment interface
- Status update interface
- Empty states
- Loading states
- Error states

==================================================
TASK DETAILS
==================================================

Create a detailed Task page/panel.

Show:
- Task title
- Description
- Status
- Priority
- Assignee
- Project
- Created by
- Created date
- Updated date
- Due date

Comments section:
- Comment list
- User avatar
- Author
- Timestamp
- Comment text
- Edit comment
- Delete comment
- Add comment

Make the comments area suitable for real-time collaboration.

==================================================
NOTIFICATIONS
==================================================

Create a notifications center.

Show:
- All notifications
- Unread notifications
- Read/unread visual state
- Timestamp
- Notification type
- Related project/task where applicable

Examples of notification types:
- Project member added
- Project member removed
- Task assigned
- Task updated
- Project events
- Comment-related events

Include:
- Unread badge
- Mark as read
- Empty state

==================================================
ADMIN USER MANAGEMENT
==================================================

Create an Admin Users page.

Display:
- User avatar
- Name
- Email
- Role
- Status
- Created date
- Actions

Roles:
- Admin
- Project Manager
- Team Member

Statuses:
- Active
- Inactive

Admin actions:
- View user
- Update role
- Activate/deactivate user
- Manage account lifecycle

Include confirmation dialogs for destructive actions.

==================================================
PROFILE
==================================================

Create a Profile page.

Show:
- Avatar
- Name
- Email
- Role
- Account status
- Profile information

Actions:
- Edit profile
- Update profile image
- Logout

==================================================
UI STATES
==================================================

For every important screen/component, create states for:

1. Normal
2. Loading
3. Empty
4. Error
5. Success
6. Disabled
7. Hover
8. Focus
9. Selected
10. Confirmation/destructive action

Do not design only the happy path.

==================================================
REAL-TIME UX
==================================================

The backend uses Socket.IO.

Design UI behavior that supports real-time updates:

- New task appears without refresh
- Task assignment updates immediately
- Task status changes immediately
- New comments appear immediately
- Edited comments update immediately
- Deleted comments disappear immediately
- New notifications appear immediately
- Project member removal immediately updates access-related UI
- Deleted projects disappear/update appropriately

Include subtle real-time feedback where appropriate.

Do not add unnecessary animations.

==================================================
ROLE-BASED ACCESS
==================================================

The frontend must visually and structurally respect permissions.

ADMIN:
- Platform-wide analytics
- User management
- Projects/tasks overview
- Administrative operations

PROJECT MANAGER:
- Accessible projects
- Owned projects
- Project management
- Task management
- Team members
- Dashboard analytics

TEAM MEMBER:
- Member projects
- Assigned tasks
- Task status updates
- Comments
- Notifications

Do not expose administrative navigation/actions to Team Members.

Do not expose Admin-only controls to Project Managers.

==================================================
RESPONSIVE DESIGN
==================================================

Create responsive layouts for:

Desktop:
1440px
1280px

Tablet:
768px

Mobile:
390px

On mobile:
- Convert sidebar into drawer
- Stack dashboard cards
- Make tables responsive
- Convert complex tables into cards where appropriate
- Keep important actions accessible
- Preserve usability

==================================================
DESIGN SYSTEM / COMPONENTS
==================================================

Create reusable components for:

- Buttons
- Inputs
- Selects
- Dropdowns
- Search
- Tabs
- Cards
- Stat cards
- Tables
- Avatars
- Badges
- Status indicators
- Priority indicators
- Modals
- Confirmation dialogs
- Toast notifications
- Tooltips
- Pagination
- Empty states
- Loading skeletons
- Error messages
- Sidebar
- Navbar
- Task cards
- Project cards
- Comment components
- Notification items
- Charts

Use consistent component variants rather than creating visually different versions of the same component.

==================================================
FIGMA STRUCTURE
==================================================

Organize the Figma file into pages:

01 — Design System
02 — Authentication
03 — Project Manager
04 — Team Member
05 — Admin
06 — Projects
07 — Project Details
08 — Tasks
09 — Task Details
10 — Notifications
11 — User Management
12 — Profile
13 — Responsive / Mobile
14 — Prototype / User Flows

Use Auto Layout extensively.

Use Components and Variants.

Use reusable styles/variables for:
- Colors
- Typography
- Spacing
- Border radius
- Shadows

Name components and layers clearly so the design can later be implemented in React.

==================================================
PROTOTYPE FLOWS
==================================================

Create clickable prototypes for the main flows.

Flow 1:
Login → Project Manager Dashboard → Projects → Project Details → Task Board → Task Details

Flow 2:
Login → Team Member Dashboard → My Tasks → Task Details → Comment

Flow 3:
Project Manager → Project → Members → Add Team Member → Confirmation

Flow 4:
Project Manager → Task → Assign Team Member → Notification

Flow 5:
Admin → Admin Dashboard → Users → User Details → Change Role / Status

Flow 6:
Notification → Related Project/Task

==================================================
IMPORTANT IMPLEMENTATION CONSTRAINT
==================================================

The final design must be realistic to implement in React.

Do not create:
- 3D interfaces
- excessive animations
- unnecessary futuristic effects
- features not described above
- overly complex interactions
- fake functionality

Prioritize usability, maintainability, accessibility, and clean component structure.

The final result should look like a polished, professional SaaS project-management application suitable for a university final-year software engineering project and portfolio presentation.

Make the UI visually consistent across all roles and screens while clearly differentiating role-specific functionality.
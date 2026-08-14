TaskFlow Full UI/UX Fix Prompt

Review the entire current TaskFlow web application design and fix any visual, UX, layout, consistency, responsiveness, navigation, and interaction problems you find. Do NOT redesign the application from scratch. Preserve the existing TaskFlow visual identity, structure, color palette, and professional SaaS dashboard style.

1. Global design system
Establish one consistent design system across every page.
Use the existing TaskFlow palette:
Primary: #2563EB
Primary hover: #1D4ED8
Sidebar: #0F172A
Main background: #F8FAFC
Card background: #FFFFFF
Main text: #0F172A
Secondary text: #64748B
Border: #E2E8F0
Success: #16A34A
Warning: #F59E0B
Error: #EF4444
Keep typography clean and consistent. Prefer Inter or another modern UI sans-serif font.
Establish consistent spacing, border radius, shadows, button heights, input heights, icon sizes, and typography hierarchy.
Do not introduce unnecessary colors or decorative elements.
2. Fix the current dashboard

Review the dashboard shown in the current design carefully.

Fix:

Alignment between sidebar, header, cards, tables, and content.
Consistent horizontal and vertical spacing.
Make all dashboard cards equal height where appropriate.
Make progress indicators visually consistent.
Improve table column alignment.
Make status badges consistent throughout the application.
Ensure long project/task names truncate cleanly instead of breaking layouts.
Ensure notification badges are positioned correctly.
Ensure the profile/avatar section is aligned correctly.
Avoid unnecessary nested scrollbars.
Make the main content area use the available screen width efficiently.
Keep the dashboard visually balanced on 1366px, 1440px, and larger desktop screens.
3. Sidebar

Create one reusable sidebar component used throughout the application.

It must contain:

TaskFlow logo
Dashboard
Projects
Tasks
Notifications
Settings
Logout
Current user profile

Add clear:

Active navigation state
Hover state
Focus state
Disabled state where appropriate
Notification badge

The sidebar must remain visually consistent on every page.

4. Header

Create one reusable application header.

Include:

Global search
Notifications
User avatar
User name
User role
Profile dropdown

Make the header consistent across all authenticated pages.

5. Role-based UI

TaskFlow has three roles:

Project Manager

Dashboard
Projects
Tasks
Notifications
Settings

Team Member

Dashboard
My Tasks
Projects
Notifications
Settings

Admin

Admin Dashboard
Users
Projects
Tasks
Notifications
Settings

Create appropriate navigation and dashboard variations for each role.

Do not expose actions that the current role is not authorized to perform.

6. Create and fix ALL application pages

Ensure the complete frontend contains properly designed pages for:

Authentication

Login
Register
Forgot Password
Reset Password

Project Manager

Dashboard
Projects List
Create Project
Edit Project
Project Details
Project Members
Project Tasks
Project Activity

Tasks

All Tasks
My Tasks
Task Details
Create Task
Edit Task

Collaboration

Comments
Notifications
Notification Details/Read state

Admin

Admin Dashboard
User Management
User Details
Project Management
Platform Statistics

Account

Profile
Settings
Change Password

System

404 Not Found
403 Forbidden
500 Server Error
Loading states
Empty states
Error states
Confirmation dialogs

Every page must use the same design system and reusable components.

7. Interactive prototype

Make the Figma prototype genuinely navigable.

Connect:

Login → Dashboard
Sidebar navigation → corresponding pages
Dashboard "View all" → Projects/Tasks
Project cards → Project Details
Project Details → Tasks/Members/Activity
Task rows → Task Details
Create buttons → Create forms
Edit buttons → Edit forms
Delete buttons → Confirmation modal
Notifications → Notifications page
User avatar → Profile menu
Settings → Settings page
Logout → Login
Admin navigation → Admin pages
Role switcher → appropriate role dashboard

Add realistic hover, active, focus, pressed, loading, success, error, and disabled states.

8. Forms

Make all forms production-quality.

Include:

Labels
Required-field indicators
Placeholder text
Validation messages
Error states
Success states
Loading states
Disabled submit buttons when appropriate
Confirmation dialogs for destructive actions

Do not make forms unnecessarily complicated.

9. Tables

All data tables should support realistic UI states:

Loading
Empty
Populated
Error
Pagination
Search/filter
Sorting where appropriate

Use consistent row height and column spacing.

10. Responsive design

Create responsive layouts for:

Desktop: 1440px
Desktop: 1280px
Tablet: 768px
Mobile: 390px

On smaller screens:

Collapse the sidebar into a mobile navigation.
Make tables responsive.
Stack dashboard cards appropriately.
Prevent horizontal overflow.
Keep buttons and form controls usable.
Preserve readable typography and spacing.
11. Real-time UI

The TaskFlow backend supports real-time Socket.IO events.

Design UI states for:

New task notification
Task assignment
Task status update
New comment
Project member added
Project member removed
Project deleted

Notifications should update visually without requiring a page refresh.

12. UX improvements

Check the entire application for:

Inconsistent spacing
Misaligned elements
Inconsistent button styles
Inconsistent badges
Poor contrast
Missing hover states
Missing focus states
Missing loading states
Missing empty states
Missing error states
Confusing navigation
Excessive whitespace
Crowded layouts
Inconsistent icon usage

Fix these issues while preserving the current TaskFlow aesthetic.

13. Accessibility

Ensure:

WCAG-conscious color contrast
Keyboard-friendly interactions
Visible focus states
Clear form labels
Accessible button/icon meaning
Do not rely on color alone to communicate status
14. React implementation readiness

Organize the Figma design so it can be directly implemented as a React application.

Use reusable components such as:

AppLayout
Sidebar
Header
Button
Input
Select
Modal
Card
Badge
Table
Pagination
Avatar
Dropdown
Toast
LoadingSpinner
EmptyState
ErrorState
ConfirmDialog
ProjectCard
TaskCard
TaskRow
NotificationItem

Avoid creating visually identical components as separate unrelated designs.

15. Final quality check

After making the changes, review every page and every prototype connection.

Make sure:

Every navigation item works.
Every major button has an interaction.
Every page has a consistent layout.
Every role has the correct navigation.
No page has broken alignment.
No content is accidentally clipped.
No unnecessary horizontal scrolling exists.
Desktop and mobile layouts work correctly.
Loading, empty, error, success, and confirmation states exist.
The entire application feels like one coherent production-quality Task Management SaaS product.

Important: Do not remove existing functionality or change the TaskFlow backend API assumptions. Do not invent unrelated features. Preserve the existing TaskFlow branding and professional blue/dark-slate visual identity.
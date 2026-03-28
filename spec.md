# Task Turtle

## Current State
- Full landing page exists: Hero, Navbar, HowItWorks, LiveMap, FeaturedTasks, TaskTimeline, OTPVerification, PaymentDemo, AdminDashboard, Footer
- Authorization component already integrated in backend (MixinAuthorization)
- Backend has: createTask, getAllTasks, getMyPostedTasks, acceptTask, completeTask, getCallerUserRole, isCallerAdmin
- No login/auth page exists - app loads directly to landing page
- No dedicated dashboard page exists
- PostTaskForm component exists but only used inline

## Requested Changes (Diff)

### Add
- Login/auth page (shown before home if not logged in) with "Login as User" and "Login as Admin" options using Internet Identity — matching image 1 design (dark, centered card, green accents, turtle logo)
- After login → redirect to home/landing page
- Navbar on landing page shows "Go to Dashboard" button when logged in
- Dashboard page (/dashboard route or conditional render) with 3-tab layout:
  - Tab 1: My Tasks — shows user's posted tasks with status, progress updates (from getMyPostedTasks)
  - Tab 2: Post Task — full PostTaskForm (createTask backend call)
  - Tab 3: Find Tasks — shows all open tasks from getAllTasks, with "Accept & Earn" button (acceptTask backend call)
- Navbar on dashboard: TaskTurtle logo, Dashboard | Tasker | Wallet | Profile tabs, Logout button

### Modify
- App.tsx: Add auth state check; show LoginPage if not authenticated, else show landing page
- Navbar.tsx: Add "Go to Dashboard" button that appears when user is logged in

### Remove
- Nothing removed

## Implementation Plan
1. Create LoginPage.tsx — matching image 1: centered dark glassmorphic card, turtle logo top, "Login as User" (green border) and "Login as Admin" (gold border) buttons, both trigger Internet Identity login, "Secured by Internet Identity" footer note
2. Create Dashboard.tsx — navbar with tabs (Dashboard active, Tasker, Wallet, Profile, Logout), heading "Customer Dashboard" with green accent, 3 tab switcher: My Tasks (badge count), Post Task, Find Tasks (badge count)
3. My Tasks tab — calls getMyPostedTasks(), renders task cards with title, status badge (In Progress/Open/Completed), description, location, contact, amount, tip, progress updates timeline
4. Post Task tab — reuses PostTaskForm with createTask backend call
5. Find Tasks tab — calls getAllTasks() filtered to #open, renders task cards with title, location, amount, "Call Customer" button, "Accept & Earn" green button calling acceptTask
6. Update App.tsx routing: check auth → LoginPage or LandingPage; add router for /dashboard
7. Update Navbar.tsx: show "Go to Dashboard" button when logged in

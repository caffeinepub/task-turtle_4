# Task Turtle — Pickup-Drop Task System

## Current State

Task Turtle has a functioning Daily Task system:
- Backend: `main.mo` with Task, EscrowPayment, UserProfile data models and createTask/acceptTask/completeTask/getTasks functions
- Frontend: Dashboard.tsx with 3 tabs (My Tasks, Post Task, Find Tasks), TaskerPage.tsx for tasker acceptance, AdminDashboard.tsx with 7 tabs (Overview, Tasks, Users, Taskers, Payments, Payouts, Profiles)
- Payment: Razorpay integration via `/api/create-order` and `/api/verify-payment` Next.js API routes
- Routing: Hash-based routing in App.tsx (#dashboard, #tasker, #admin, etc.)

## Requested Changes (Diff)

### Add
- **PickupDropTask data model** in main.mo: separate stable map `pickupDropTasks` with fields: id, pickupOwnerName, pickupContact, pickupLocation, dropOwnerName, dropContact, dropLocation, productWorth, taskerFee, boostFee, status, poster, acceptor, razorpayOrderId, razorpayPaymentId, paymentStatus, createdAt
- **PickupDropActiveTask** model: taskId, taskerId, taskerPaymentDone, status, otpPickup, otpDelivery, taskerOrderId, taskerPaymentId
- **Backend functions**: createPickupDropTask, getPickupDropTasks, acceptPickupDropTask (requires tasker payment), completePickupDropDelivery (OTP verify), getMyPickupDropPostedTasks, getMyPickupDropAcceptedTasks
- **PostTaskCategorySelector component**: shown when user clicks "Post Task", offers 2 large cards (Daily Task vs Pickup-Drop Task)
- **PickupDropPostForm component**: new form with Pickup Details (name, contact, location), Drop Details (name, contact, location), Task Details (product worth, tasker fee, boost fee). User pays taskerFee + boostFee via Razorpay.
- **PickupDropFindTasks component**: shown under new "Pickup-Drop" tab in Find Tasks. Cards show: product worth (highlighted), net earning (after 15% cut, not breakdown), pickup location, drop location, Accept Task button.
- **PickupDropAcceptModal component**: popup when tasker clicks Accept, shows product worth amount, triggers Razorpay payment for product worth.
- **MyPickupDropTasks component**: new section in My Tasks tab with full pickup/drop details, product worth, earnings, status.
- **Admin Dashboard "Pickup-Drop" tab**: shows all pickup-drop tasks with status, poster, tasker info, payment details.
- **Razorpay integration for Pickup-Drop**: `/api/create-pd-order` for user task posting payment, `/api/verify-pd-payment` for user payment, `/api/create-tasker-order` for tasker deposit payment, `/api/verify-tasker-payment` for tasker deposit.

### Modify
- **Dashboard.tsx Post Task tab**: wrap existing PostTaskForm with the new category selector. When "Daily Task" is selected, show existing form. When "Pickup-Drop Task" is selected, show new PickupDropPostForm. Existing PostTaskForm code must NOT change.
- **Dashboard.tsx Find Tasks tab**: add category tabs (Daily Tasks | Pickup-Drop Tasks). Daily Tasks tab shows existing find-tasks UI unchanged. Pickup-Drop tab shows new PickupDropFindTasks.
- **Dashboard.tsx My Tasks tab**: add subsections — "My Daily Tasks" (existing unchanged) and "My Pickup-Drop Tasks" (new).
- **AdminDashboard.tsx**: add "Pickup-Drop" tab to the existing 7 tabs.
- **App.tsx**: no route changes needed; all changes are within Dashboard and Admin pages.

### Remove
- Nothing from existing Daily Task system.

## Implementation Plan

1. Add PickupDrop types and functions to `main.mo` backend (separate stable maps, no touching existing ones)
2. Update `backend.d.ts` and `backend.ts` to expose new backend functions
3. Create `/api/create-pd-order/route.ts` and `/api/verify-pd-payment/route.ts` for user-side Razorpay
4. Create `/api/create-tasker-order/route.ts` and `/api/verify-tasker-payment/route.ts` for tasker deposit Razorpay
5. Create `PickupDropPostForm.tsx` component (standalone, full form)
6. Create `PickupDropTaskCard.tsx` component (for Find Tasks view)
7. Create `PickupDropAcceptModal.tsx` (deposit payment popup)
8. Create `MyPickupDropTasks.tsx` (tasker's accepted PD tasks)
9. Modify Dashboard.tsx: wrap Post Task, Find Tasks, My Tasks with category selector/tabs — additive only
10. Modify AdminDashboard.tsx: add 8th tab for Pickup-Drop tasks
11. Earning formula: net_earning = (tasker_fee + boost_fee) * 0.85 — shown in Find Tasks only

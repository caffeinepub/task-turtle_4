# Task Turtle

## Current State
- Post Task form submits directly to `createTask` backend without any payment
- My Tasks tab shows all tasks with no cancel functionality
- Tasker OTP verify works and marks task as completed
- `createTask`, `acceptTask`, `completeTask`, `verifyPayment` all exist in backend
- No `cancelTask` function exists

## Requested Changes (Diff)

### Add
- Razorpay payment step in PostTaskTab: before calling `createTask`, open Razorpay checkout modal with full task amount. Only after `handler` callback (payment success) call `createTask` and `verifyPayment`.
- Cancel button in MyTasksTab: only shown when task.status === TaskStatus.open. Calls new `cancelTask` backend function. Hidden once task is accepted.
- OTP display in MyTasksTab: when task.status === TaskStatus.accepted, show a green info box with the task's OTP (fetched via `getTaskWithOtp`). Customer shares this OTP with tasker for delivery verification.
- "Task Delivered" success state in MyTasksTab: when task.status === TaskStatus.completed, show a green "Delivered ✓" badge and completion message.
- `cancelTask` backend function in main.mo: only poster can cancel, only works when status = #open, removes task from map.
- `cancelTask` method signature in backend.d.ts.

### Modify
- PostTaskTab submit button label: "Pay & Post Task" → opens Razorpay, then posts task after payment.
- MyTasksTab TaskCard: add action slot for cancel/OTP/delivered states.

### Remove
- Nothing removed

## Implementation Plan
1. Add `cancelTask(taskId: Text): async Result` to main.mo — only poster, only #open status, deletes task from map.
2. Add `cancelTask(taskId: string): Promise<Result>` to backendInterface in backend.d.ts.
3. In Dashboard.tsx PostTaskTab: Load Razorpay JS (https://checkout.razorpay.com/v1/checkout.js) via script tag on mount. On form submit+validate: open `window.Razorpay` checkout with key `rzp_live_SRNbTwyEmzQSvO`, amount in paise, theme color `#00E676`. In `handler` callback: call `actor.verifyPayment(paymentId, '', '', tempId, amount, '', '')` then `actor.createTask(...)`. Show loading during payment. Handle dismiss (go back to form).
4. In Dashboard.tsx MyTasksTab: For each task card:
   - status=open: show red "Cancel" button. On click: call `actor.cancelTask(id)`, remove from list.
   - status=accepted: call `actor.getTaskWithOtp(id)` and show a green box "Your OTP: XXXXXX — Share with tasker at delivery". Also show "Cannot cancel — tasker assigned" note.
   - status=completed: show "✓ Task Delivered" green badge.

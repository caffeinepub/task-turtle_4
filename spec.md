# Task Turtle — Real-Time Task Tracking System

## Current State
- Task has 3 statuses: open, accepted, completed
- Tasker stage is stored in localStorage (not DB)
- No real-time sync between user and tasker
- Tasker cannot see user's contact details after accepting
- User cannot see tasker's details on live tracking
- Live tracking on My Tasks is static (3 steps only)

## Requested Changes (Diff)

### Add
- `ExtendedStage` type in Motoko: posted | accepted | on_the_way | arrived | verified | delivered
- `taskStages` stable map (taskId → ExtendedStage + updatedAt)
- `advanceTaskStage(taskId, stage)` - tasker can advance to on_the_way / arrived
- `getTaskStage(taskId)` - public query, anyone can poll
- `getTaskParticipantProfiles(taskId)` - returns {userProfile, taskerProfile} if caller is poster or acceptor
- Frontend: `useTaskStage` hook that polls backend every 3s for live updates
- Dashboard MyTasksTab: 6-step live tracking timeline (matching homepage style: dark, neon green progress line, Done/In Progress tags) + tasker name/phone
- TaskerPage ActiveTaskCard: replace localStorage stages with backend stages; show user name/phone/address/description; "Call User" (tel:) button
- TaskerPage: control panel buttons (On the Way, Arrived, Verify OTP, Mark Delivered)

### Modify
- `acceptTask`: also set taskStage to `accepted`
- `completeTask` (OTP verify): set taskStage to `delivered` after success
- TaskerPage `ActiveTaskCard`: remove localStorage, use real backend stage via polling
- Dashboard `MyTasksTab`: expand 3-step progress to 6-step live polling timeline

### Remove
- `getStoredStage` / `setStoredStage` localStorage helpers in TaskerPage

## Implementation Plan
1. Update `src/backend/main.mo`: add ExtendedStage, taskStages map, advanceTaskStage, getTaskStage, getTaskParticipantProfiles, modify acceptTask/completeTask
2. Update `src/frontend/src/backend.d.ts`: add new types and function signatures
3. Update `src/frontend/src/backend.ts`: add new function wrappers
4. Add `useTaskStage` polling hook (3s interval)
5. Rebuild `TaskerPage.tsx`: active task shows user details + call button, stage control panel uses backend
6. Rebuild `Dashboard.tsx` MyTasksTab: 6-step live tracking with polling, tasker name/phone

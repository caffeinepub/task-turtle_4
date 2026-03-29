# Task Turtle

## Current State
- AdminDashboard.tsx has Users and Taskers tabs that show `—` for name, phone, location (no real data)
- All Tasks tab shows only date (not time) for when task was posted
- No timestamps for when task was accepted or completed
- No "View Profile" button in Users/Taskers tabs
- Backend Task type had only `createdAt`, no `acceptedAt` or `completedAt`
- Backend had no `getAllUserProfiles` admin function

## Requested Changes (Diff)

### Add
- `acceptedAt: ?Int` and `completedAt: ?Int` fields to Task and PublicTask types in backend (DONE)
- `getAllUserProfiles()` admin query function in backend (DONE)
- `UserProfileEntry` type in backend (DONE)
- Date+time display in All Tasks tab: show posted time, accepted time, completed time
- "View Profile" button in Users tab that opens a modal showing full profile (name, phone, location, UPI ID, aadhar/student ID)
- "View Profile" button in Taskers tab that opens a modal showing full profile
- Fetch all user profiles via `getAllUserProfiles()` in AdminDashboard and use to populate name, phone, location, UPI ID in Users and Taskers tabs

### Modify
- `formatDate` helper → `formatDateTime` to show both date and time
- All Tasks tab: date column shows posted time, add accepted time and completed time columns
- Users tab: populate Name, Phone No, Location columns from real profile data
- Taskers tab: populate Name, Phone, Location columns from real profile data
- AdminDashboard main component: call `getAllUserProfiles()` during `loadData()` and store in state

### Remove
- Nothing removed

## Implementation Plan
1. Update backend.d.ts types to include `acceptedAt` and `completedAt` in PublicTask, and add `UserProfileEntry` type + `getAllUserProfiles` function signature
2. Update AdminDashboard `loadData()` to also call `actor.getAllUserProfiles()` and store profiles in state as `Map<string, UserProfile>`
3. Update `formatDateTime` helper to show date + time (e.g. "29 Mar, 2:45 PM")
4. Update All Tasks tab: replace single Date column with "Posted", "Accepted", "Completed" time columns
5. Update Users tab: look up profile by principal, show real name/phone/location/UPI ID; add "View Profile" button that opens a modal
6. Update Taskers tab: same as users tab
7. Profile modal component: glassmorphic dark modal showing all profile fields

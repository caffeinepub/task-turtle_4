# Task Turtle – My Profile Page

## Current State
- Backend has `UserProfile` type with only `name: Text`
- `saveCallerUserProfile` and `getCallerUserProfile` functions exist
- Dashboard navbar has a "Profile" tab pill (currently non-functional)
- App uses hash-based routing (`#dashboard`)

## Requested Changes (Diff)

### Add
- Extend `UserProfile` Motoko type with: `phone`, `location`, `upiId`, `aadharNumber` (optional), `studentId` (optional)
- New `MyProfile.tsx` page component with form and validation
- Route `#profile` in App.tsx to render `<MyProfile />`
- Wire "Profile" tab in Dashboard navbar to navigate to `#profile`

### Modify
- `UserProfile` type in `main.mo`: add new fields
- `saveCallerUserProfile` and `getCallerUserProfile` backend functions accept/return updated type
- Dashboard Profile button navigates to `#profile` instead of being a no-op

### Remove
- Nothing removed

## Implementation Plan
1. Update `UserProfile` in `main.mo` to include `phone`, `location`, `upiId`, `aadharNumber: ?Text`, `studentId: ?Text`
2. Regenerate backend bindings (handled by generate_motoko_code)
3. Create `src/frontend/src/pages/MyProfile.tsx` with:
   - Form fields: Name, Phone, Location, UPI ID, Aadhar Number, Student ID
   - Validation: all required except aadhar/student where at least one is needed
   - Prefill from `actor.getCallerUserProfile()`
   - Save via `actor.saveCallerUserProfile()`
   - Success message after save
4. Add `#profile` hash route in `App.tsx` → renders `<MyProfile />`
5. Wire "Profile" nav pill in Dashboard header to `window.location.hash = '#profile'`

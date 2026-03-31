# Task Turtle — Payment + Pricing System Upgrade

## Current State

- `PostTaskTab` inside `Dashboard.tsx` has: Title, Description, Pickup/Delivery Location, Contact Number, Amount (₹), Category, and a "Tip your Tasker" section (±₹20/₹50/₹100 toggle buttons)
- Final amount = base amount + optional tip
- Razorpay charges `finalAmount * 100` paise
- `platformFee.ts` has a flat 5% `getPlatformFee` and `getTaskerEarning` (95%)
- Button shows `Pay ₹{finalAmount} & Post Task`
- No platform fee structure — no tiered fee, no boost system

## Requested Changes (Diff)

### Add
- **Tasker Fee section** (replaces Tip): 4 preset buttons (₹10 Economy🐢, ₹15 Standard🚶 Recommended, ₹25 Fast⚡, ₹40 Priority🔥) + custom number input
- **Dynamic feedback** per fee tier: ≤₹10 warning, ₹15 positive, ≥₹25 priority message
- **Validation**: disable submit + show error if tasker_fee < ₹10
- **Boost system** (+₹10 / +₹20 toggle, optional) below Tasker Fee section
- **Tiered hidden platform fee** logic: ₹0–₹99 → ₹4, ₹100–₹299 → ₹7, ₹300–₹500 → ₹10
- **Total Payable display** above button: "Total Payable: ₹XXX" + "(includes all charges)" — live real-time update
- **New utility functions** in `platformFee.ts`: `calculatePlatformFee`, `calculateTotalPayable`, `validateTaskerFee`, `calculateCommission`, `calculateTaskerPayout`

### Modify
- **Button text**: from `Pay ₹{finalAmount} & Post Task` → `Pay ₹{totalPayable} & Post Task` (dynamic, real-time)
- **Razorpay amount**: now `totalPayable * 100` (includes platform fee + tasker fee + boost)
- **WalletTab / WalletPage**: update earning formula from flat 95% to new payout formula: `tasker_payout = amount + (tasker_fee + boost - 0.15 * (tasker_fee + boost))` — since task.amount in DB is now the full total, use a best-effort approximation using stored amount
- **`platformFee.ts`**: replace old 5% functions with new tiered functions

### Remove
- "Tip your Tasker (optional)" section with ₹20/₹50/₹100 buttons
- `type Tip = 20 | 50 | 100 | null` and related state/logic from PostTaskTab
- Old flat 5% fee references

## Implementation Plan

1. Update `src/frontend/src/utils/platformFee.ts` with new exported functions
2. In `Dashboard.tsx` `PostTaskTab`:
   a. Remove Tip state, type, and UI block
   b. Add `taskerFee` state (default 15) and `boost` state (default 0)
   c. Add Tasker Fee section with 4 preset buttons + custom input + dynamic feedback
   d. Add Boost section with +₹10 / +₹20 toggle buttons
   e. Recalculate `totalPayable` in real-time using new utility
   f. Update Total display and button
   g. Add validation: tasker_fee < 10 disables button
   h. Update Razorpay amount to `totalPayable`
3. Update `WalletTab.tsx` and `WalletPage.tsx` to reference new payout formula

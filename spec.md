# Task Turtle

## Current State
Pricing system uses: tiered platform_fee (₹4/₹7/₹10) paid by user, 15% commission on tasker_fee+boost deducted from tasker payout.

Tasker view (AvailableTaskCard): shows Buy Item + Earn (tasker_fee+boost) + Total You Get (task_amount + earnings). No platformCut deduction shown.

Tasker active view (ActiveTaskCard): shows Buy Item (reimbursed) + Your Earning + Total You Get — but earnings shown are GROSS (not net after 15% cut).

Post Task breakdown: shows Amount (product) + Tasker Fee + Boost + Total Payable (missing explicit Platform Fee line).

## Requested Changes (Diff)

### Add
- New calculation helpers in `platformFee.ts`: `calculateGrossEarning`, `calculatePlatformCut`, `calculateNetEarning`, `calculateTotalReturned`
- Platform Fee line in Post Task price summary (user side)
- `platformCut` deduction clearly shown in ActiveTaskCard (My Active Tasks)

### Modify
- `platformFee.ts`: add precise new helpers using spec formula
- `PostTaskTab` in `Dashboard.tsx`: price summary box must show all 5 lines: Task Amount / Tasker Fee / Boost Fee (if any) / Platform Fee / Total Payable
- `AvailableTaskCard` in `TaskerPage.tsx`: replace earnings block with simple two-line view: `Task Value (You spend): ₹X` + `You earn: ₹{netEarning}` (green, bold, PRIMARY) + small `"after platform fee"` note. NO total_paid, NO platform_fee visible
- `ActiveTaskCard` in `TaskerPage.tsx`: replace earnings block with full 5-line breakdown: Task Value / Gross Earning / Platform Fee 15% / You earn Final / Total Amount Returned

### Remove
- Old earnings display logic in AvailableTaskCard (taskerFee + boost raw, Total You Get without deduction)
- Old earnings display logic in ActiveTaskCard (gross earnings shown as net)

## Implementation Plan
1. Update `src/frontend/src/utils/platformFee.ts` — add new helpers
2. Update `PostTaskTab` in `Dashboard.tsx` — 5-line price summary
3. Update `AvailableTaskCard` in `TaskerPage.tsx` — simple 2-line tasker view
4. Update `ActiveTaskCard` in `TaskerPage.tsx` — full 5-line breakdown
5. Validate and build

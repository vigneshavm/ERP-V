---
description: Manage loan EMI schedules — tracks upcoming payments, validates bank balance sufficiency, and records EMI payments
---

# Loan & EMI Management Workflow

Use the **finance-agent** skill for all loan reasoning in this workflow.

## Steps

1. **Fetch All Active Loans**
   Call `GET /api/loans` and filter loans where `status === 'active'`.

2. **Calculate EMI Schedule**
   For each active loan:
   - `monthsElapsed` = difference in months between `startDate` and today
   - `expectedPayments` = `monthsElapsed`
   - Fetch actual payments: `GET /api/loans/:id` → check `payments.length`
   - `missedEMIs` = `expectedPayments - payments.length`
   - `nextEMIDue` = first day of next month (or overdue if `missedEMIs > 0`)

3. **Flag Overdue EMIs**
   - If `missedEMIs > 0` → 🔴 Overdue — record as critical alert
   - If EMI due within 7 days → 🟡 Upcoming EMI Alert

4. **Validate Bank Balance**
   For each loan with an upcoming EMI:
   - Call `GET /api/finance/accounts/:id/effective-balance?date=[nextEMIDate]`
   - If `effectiveBalance < emiAmount` → 🔴 Insufficient Funds Alert
   - Recommend which bank account has the best float

5. **Compute Loan Health Score**
   For each loan:
   - `percentPaid` = `((principalAmount - totalPendingAmount) / principalAmount) * 100`
   - `remainingMonths` = `Math.ceil(totalPendingAmount / emiAmount)`
   - `healthScore` = `missedEMIs === 0 ? 'Good' : missedEMIs <= 2 ? 'At Risk' : 'Critical'`

6. **Record EMI Payment (on demand)**
   When user triggers payment:
   - Collect: `paymentDate`, `amountPaid`, `paymentMethod`, `bankAccountId`, `referenceNumber`
   - Call `POST /api/loans/:id/payments` with the above payload
   - Confirm: log success, show updated `totalPendingAmount`

7. **Generate Loan Summary Report**
   ```
   ## Loan EMI Report — [Today's Date]
   
   **Active Loans:** N  |  **Total EMI Burden (Monthly):** ₹X,XX,XXX
   **Overdue EMIs:** N loans  |  **EMIs Due This Week:** N
   
   ### Loan Health
   | Loan Name | EMI | Pending | Health | Next Due |
   |-----------|-----|---------|--------|----------|
   | ...       | ... | ...     | ...    | ...      |
   
   ### Recommended Actions
   1. [actions]
   ```

8. **Display**
   Present in the Finance Agent Dashboard → "Loan EMI Agent" panel with progress bars and alert badges.

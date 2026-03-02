---
description: Bill approval and due tracking workflow — ages outstanding bills, validates payment feasibility, and recommends pay/defer decisions
---

# Bill Approval & Due Tracking Workflow

Use the **finance-agent** skill for all bill analysis and approval reasoning.

## Steps

1. **Fetch Outstanding Bills**
   Call `GET /api/finance/bills` and filter for unpaid/partially paid bills.

2. **Age the Bills**
   For each bill, compute:
   - `daysOutstanding` = today - `bill.dueDate`
   - Bucket into aging brackets:
     - `0-30 days` → Current
     - `31-60 days` → Overdue 🟡
     - `61-90 days` → High Risk 🔴
     - `>90 days` → Critical — Penalty Risk 🔴

3. **Rank Bills**
   Sort by priority score:
   ```
   priorityScore = (daysOutstanding * 2) + (amount / 10000)
   ```
   Higher score = pay first.

4. **Fetch Effective Bank Balance**
   Call `GET /api/finance/accounts/:id/effective-balance` for each candidate bank account.
   Build a map: `{ accountId → effectiveBalance }`.

5. **Validate Payment Feasibility**
   For each bill (highest priority first):
   - Check if any bank account has `effectiveBalance >= bill.outstandingAmount`
   - If yes → `recommendation = 'Pay Now'`, note which account
   - If no → `recommendation = 'Defer'`, explain shortfall
   - Use `POST /api/finance/validate-payments` for batch validation if needed

6. **Penalty Detection**
   If supplier terms (from bill data) include a late fee clause:
   - Compute `penaltyAmount = bill.outstandingAmount * (penaltyRate / 100)`
   - If `penaltyAmount > 0 && daysOutstanding > gracePeriod` → 🔴 Penalty Active

7. **Generate Approval Recommendation Report**
   ```
   ## Bill Approval Report — [Today's Date]
   
   **Total Outstanding:** ₹X,XX,XXX across N bills
   **Critical (90+ days):** N bills (₹X,XX,XXX)
   **Payable Now (funds available):** N bills (₹X,XX,XXX)
   
   ### Bill Queue (Priority Order)
   | Supplier | Amount | Age | Status | Recommended Action | Account |
   |----------|--------|-----|--------|-------------------|---------|
   | ...      | ...    | ... | ...    | ...               | ...     |
   
   ### Recommended Actions
   1. [actions]
   ```

8. **Trigger Payment (on approval)**
   When user approves a bill:
   - Call `PUT /api/finance/bills/:id` to mark as paid / partially paid
   - Create corresponding cashbank transaction via `POST /api/finance/transactions`

9. **Display**
   Present in Dashboard → "Bill Approval Agent" panel with aging heatmap and pay queue.

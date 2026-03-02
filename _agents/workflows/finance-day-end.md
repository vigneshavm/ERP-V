---
description: Daily finance day-end reconciliation — computes closing cash position, reconciles PDCs, flags discrepancies, and saves the day-end record
---

# Day-End Reconciliation Workflow

Use the **finance-agent** skill for all day-end reasoning and validation.

## Steps

1. **Set Target Date**
   Default to today (`new Date()`). User may override to reconcile a past date.

2. **Fetch Day-End Summary**
   Call `GET /api/finance/day-end?date=[targetDate]`.
   Extract:
   - `openingCash` (from prior day's closing, or 0 if first day)
   - `cashSales` = total cash-in for the day
   - `cashExpenses` = total cash-out for the day
   - `expectedCash` = `openingCash + cashSales - cashExpenses`

3. **Fetch Today's Cheque Activity**
   Call `GET /api/finance/cheques` and filter for `date === targetDate`:
   - Cheques received today (`type=RECEIVED`) → add to expected inflows
   - Cheques issued today (`type=ISSUED`) → add to expected outflows
   - PDCs due today (`status=PENDING, date=today`) → 🟡 PDC Alert: must be cleared

4. **Bank Balance Cross-Check**
   Call `GET /api/finance/bank-summary` and compare:
   - `systemExpectedBalance` = sum of all account balances
   - `computedBalance` = prior opening + all net flows today
   - If `Math.abs(systemExpectedBalance - computedBalance) > 500` → 🔴 Balance Discrepancy

5. **Discrepancy Analysis**
   For any discrepancy:
   - List all transactions > ₹1,000 from today
   - Flag any transaction missing a `reference` field
   - Suggest: check physical cash count, verify DD / NEFT clearances

6. **Top 5 Transactions of the Day**
   Sort today's transactions by amount (desc), take top 5.

7. **PDC Clearance Reminders**
   For each PDC (`status=PENDING`) due today:
   - Remind user to physically clear and update status to `CLEARED` via `PATCH /api/finance/cheques/:id/status`

8. **Save Day-End Record**
   Once user confirms:
   - Call `POST /api/finance/day-end/save` with payload:
     ```json
     {
       "date": "[targetDate]",
       "openingCash": X,
       "cashSales": X,
       "cashExpenses": X,
       "closingCash": X,
       "discrepancy": X,
       "notes": "..."
     }
     ```

9. **Generate Day-End Report**
   ```
   ## Day-End Report — [Date]
   
   | Item | Amount |
   |------|--------|
   | Opening Cash | ₹X,XX,XXX |
   | Cash Sales (In) | ₹X,XX,XXX |
   | Cash Expenses (Out) | ₹X,XX,XXX |
   | Expected Closing Cash | ₹X,XX,XXX |
   | System Total Balance | ₹X,XX,XXX |
   | Discrepancy | ₹X,XXX |
   
   ### PDCs Due Today: N
   ### Top Transactions:
   1. [transaction details]
   
   ### Status: ✅ Balanced / ⚠️ Discrepancy Detected
   ```

10. **Display**
    Present in Dashboard → "Day-End Agent" panel with a checklist UI and save button.

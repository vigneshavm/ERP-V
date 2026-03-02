---
description: Bank reconciliation workflow — matches bank statement entries against ERP transactions and surfaces unreconciled items
---

# Bank Reconciliation Workflow

Use the **finance-agent** skill for all matching and reconciliation reasoning.

## Steps

1. **Select Bank Account**
   User selects a bank account from `GET /api/finance/accounts`.

2. **Upload or Fetch Bank Statement**
   - If PDF: Use `POST /api/finance/bank-statement/upload` to parse the bank statement
   - If manual: Fetch known statement transactions from `GET /api/finance/bank-statement/transactions/:accountId`

3. **Fetch ERP Transactions**
   Call `GET /api/finance/accounts/:id/ledger?startDate=X&endDate=Y` to get all ERP-side transactions for the reconciliation period.

4. **Matching Algorithm**
   For each bank statement line:
   - Find an ERP transaction where:
     - `Math.abs(bankAmount - erpAmount) < 1` (within ₹1 tolerance)
     - `Math.abs(bankDate - erpDate) <= 2 days`
   - If matched → mark as reconciled via `PATCH /api/finance/transactions/:id/reconcile` (`{ reconciled: true }`)
   - If unmatched → add to "Pending Review" list

5. **Classify Unmatched Items**
   - Unmatched **bank credit** (money in, no ERP record) → Possible unrecorded income → 🔴 Action Required
   - Unmatched **bank debit** (money out, no ERP record) → Possible unrecorded expense → 🔴 Action Required
   - Unmatched **ERP transaction** (in ERP but not in bank) → Possible PDC not yet cleared → 🟡 Review Pending

6. **Bulk Reconcile Matched Items**
   Call `POST /api/finance/transactions/bulk-reconcile` with `{ transactionIds: [...], reconciled: true }`.

7. **Compute Reconciliation Stats**
   - `reconciledCount`, `unmatchedCount`, `reconciledPercent`
   - `totalUnmatchedValue` = sum of all unmatched amounts

8. **Generate Reconciliation Report**
   ```
   ## Bank Reconciliation — [Account Name] — [Period]
   
   **Reconciled:** X of Y transactions (Z%)
   **Unmatched Bank Items:** N (₹X,XX,XXX)
   **Unmatched ERP Items:** N (₹X,XX,XXX)
   
   ### Unmatched Items (Action Required)
   | Date | Description | Amount | Side | Suggested Action |
   |------|-------------|--------|------|-----------------|
   | ...  | ...         | ...    | ...  | ...             |
   
   ### Recommended Actions
   1. [actions]
   ```

9. **Display**
   Present in Dashboard → "Reconciliation Agent" panel with a match-rate gauge and item list.

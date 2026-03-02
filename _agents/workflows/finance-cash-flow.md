---
description: Analyze and report on business cash flow — computes net cash position, period comparisons, and anomaly detection
---

# Cash Flow Analysis Workflow

Use the **finance-agent** skill for all financial reasoning in this workflow.

## Steps

1. **Fetch Bank Summary**
   Call `GET /api/finance/bank-summary` to get total bank balance, account count, and per-account balances.

2. **Fetch All Transactions**
   Call `GET /api/finance/transactions` to retrieve all cashbank transactions. Filter to:
   - Current month (MTD)
   - Previous month (for comparison)

3. **Compute Net Cash Flow**
   - `totalCashIn` = sum of all transactions where `type === 'in'` (current month)
   - `totalCashOut` = sum of all transactions where `type === 'out'` (current month)
   - `netFlow` = `totalCashIn - totalCashOut`
   - `priorNetFlow` = same calculation for previous month

4. **Period Comparison**
   - Compute: `changePercent = ((netFlow - priorNetFlow) / Math.abs(priorNetFlow)) * 100`
   - Flag if `changePercent < -20` as 🔴 Critical, `-20 to -10` as 🟡 Warning, else 🟢 OK

5. **Anomaly Detection**
   Scan transactions for:
   - Any single outflow > 30% of total bank balance → 🔴 Large Outflow Alert
   - Any inflow without a matching sales record (fromAccount not in known accounts) → 🟡 Unmatched Inflow
   - Any account balance < ₹10,000 → 🟡 Low Balance Warning

6. **Fetch Pending PDCs**
   Call `GET /api/finance/cheques?sector=all` and filter for `type=ISSUED, status=PENDING`.
   - Sum total committed outflows from PDCs
   - Compute `projectedBalance = totalBankBalance - totalPDCValue`

7. **Generate Report**
   Output a structured cash flow report:
   ```
   ## Cash Flow Report — [Current Month]
   
   **Net Cash Flow (MTD):** ₹X,XX,XXX ([+/-]Y% vs last month)
   **Projected Available Balance:** ₹X,XX,XXX (after pending PDCs)
   
   ### Findings
   - [findings list]
   
   ### Recommended Actions
   1. [actions]
   ```

8. **Save/Display**
   Present the report in the Finance Agent Dashboard under the "Cash Flow Agent" panel.

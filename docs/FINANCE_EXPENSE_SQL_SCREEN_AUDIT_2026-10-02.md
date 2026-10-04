# Finance and expense SQL screen audit — 2026-10-02

No SQL schema changes were made. This traces mounted SQL-only APIs and the source used by reports.

| Screen group | Existing SQL path and tables | Decision |
|---|---|---|
| Finance overview, cash/bank accounts, transfers, ledger, reconciliation | `GET /api/cashbank` is a read-only aggregate over `CashInOutEntry`, `openpattycash`, `closepattycash`, `BankTransEntry` and `sales2`. No account master, transfer-pair lifecycle or reconciliation write API is mounted. | Operational screens unavailable; data adapter remains read-only. |
| Cheques / statements | `GET /api/cashbank/cheques` derives rows from `BankTransEntry.ChqNo`, `ChqDate` and `ChqStatus`. It does not create/update cheque records or prove status transitions. | Read-only feed; cheque-vault and bank-statement screens unavailable. |
| Petty cash / daily summary | `GET /api/daily-finance` derives sales tender totals, `closepattycash` counted totals and `expenseentry` totals. There is no mounted daily-close/save route. | No entry or close action; summary adapter remains read-only. |
| Loans, goals, journal, EMI, card terminals, SMS tracker, budget | No compatible mounted SQL transaction/configuration route was found for these lifecycles. | Unavailable. |
| Expense tracker / entry | `dbo.expenseentry` read adapter selects `slno`, `code`, `exname`, `exoutamt`, `expens`, `remarks`, `ex_no`, `date`, `Counter_Name`. It has no mapped receipt, user/tenant, payment account, approval, void or reversal fields. The route is not exposed by `app.ts`; SQL-only route gate rejects it. | Entry/edit/delete unavailable. Unsafe SQL create/update/delete adapter functions removed. |
| Expense categories / recurring | Existing `dbo.expensegroup` and `dbo.expensename` are mapped by the Textilesoft master adapter; `expenseentry.exname` references category text. These masters do not carry monthly budgets, approval, GST-eligibility or recurrence fields. | Read-only names/groups use existing masters; category edits route through the existing SQL master API. Budget/approval and recurring screens unavailable; no new table. |
| Expense and finance reports | Mounted `/api/reports/finance/*` routes use Textilesoft SQL: `sales2`, purchase/return sources, lot costs, `expenseentry`, and cash/bank tables. Expense totals use `exoutamt`; values are treated as cash and user identity is “Unknown”. | API reports remain read-only; screens with legacy/mixed API calls are unavailable until rewired. |

## Calculation and balance limits

- Cash/bank totals are derived from source transaction rows for the requested date range. They are not authoritative current account balances or a complete general ledger.
- Daily close compares only fields stored in the existing close row; no independent reconciliation or transfer-pair match is calculated.
- Bank rows expose stored `TranBalanceAmount`, but no opening balance contract or sequence reconciliation is enforced by the adapter.
- `sqlExpenses` maps `exoutamt` to amount and hardcodes cash. It does not filter a verified void/cancel state because no such state is mapped. Expense totals can therefore differ from operational cash/bank ledgers.
- Reports exclude finance entries that are not represented in those shop tables. SQL-only reports contain no Mongo source, but source completeness and totals were not independently reconciled to a sample close or bank statement in this task.

Finance and expense UI routes now display an unavailable state instead of calling mixed or unsupported workflows. Existing SQL report endpoints stay read-only. The category report adapter reads existing Textilesoft masters and does not write an ERP category table. No SQL write or DDL was run.

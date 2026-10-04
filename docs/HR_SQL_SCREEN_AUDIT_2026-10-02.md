# HR and payroll SQL screen audit — 2026-10-02

No SQL schema changes were made. The mounted `GET /api/hr/employees` adapter reads `dbo.newemployee`; it is not a payroll or attendance ledger.

| Screen | SQL evidence | Disposition |
|---|---|---|
| Staff directory | `newemployee` adapter maps code, name, contact/address, category/group/section, salary and related HR master fields. Lookups read `empolyeecatagary`, `empolyeegroupentry` and `empolyeesectionentry`. | Disabled in UI; reads have no rows in the inspected database and the SQL-only route gate does not expose the HR endpoint. |
| Attendance / daily board | No mounted SQL attendance event API or employee/date status lifecycle was found. `closepattycash` has a day-close `salary_amnt` field, but it is not an employee attendance/payroll history. | Unavailable. |
| Payroll, salary structure, payslips, allowances and advances | `newemployee` carries master amount fields, but no verified pay-period runs, components/deductions, employee payments, payslip snapshots or reversal lifecycle was found. | Unavailable. |
| Commission | Employee master has commission-related fields, but no payout history is represented by those fields. Commission is tracked separately under SQL-068. | HR commission screen unavailable pending that audit. |

## Key evidence and safety

A read-only aggregate against the configured `SSS_copy` found zero rows in `dbo.newemployee`. SQL metadata returned no primary or unique index containing `newemployee.code`. The adapter allocates codes with `MAX+1`, which is not a stable concurrent key. The table therefore cannot safely support linked HR writes in the current environment. Existing bills refer to staff through `salsntry.sls_man`, but the aggregate did not establish join coverage.

The SQL employee route no longer exposes create, update or delete handlers; employee detail rejects multiple rows for a code. All staff/payroll/attendance/commission UI routes now show the unavailable state. HR records were not added to settings/config, and no Mongo or SQL persistence fallback is exposed by these screens.

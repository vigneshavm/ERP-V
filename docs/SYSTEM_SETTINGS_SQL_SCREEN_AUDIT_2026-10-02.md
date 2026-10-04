# System settings and administration SQL audit — 2026-10-02

No SQL schema changes were made.

| Screen/workflow | Existing SQL contract | Disposition |
|---|---|---|
| General, finance, security, branding, MIS, print, integration and subscription settings | The legacy Settings page loads/saves tenant settings and preferences through `/api/settings`, shop settings, business sectors, and unsupported inventory/category paths. The broad settings document has no single verified Textilesoft column contract. | Settings screens unavailable in SQL-only mode. |
| Users and roles | SQL authentication reads `dbo.newuser`; `GET /api/users` lists SQL users. `PUT /api/users/:id` only accepts `name`; discount limit uses existing `dbo.specialcondion` columns `bill_discount` and `dis_per`. | API retained with field validation; general role/security edits are unavailable. |
| Business profile | `/api/business/profile` reads/writes mapped fields in existing `dbo.companydetail`. Unsupported request fields are rejected. | SQL API retained; generic Settings page disabled. |
| Branch, store, company, warehouse, counter | Existing Textilesoft masters are in `branchdetail`, `companydetail`, `warehousedetail`, and `countername`; rename/delete checks use table references. `app.ts` allows these SQL route groups. | API retained; generic Settings pages disabled until their full UI contract is traced. |
| Master data | `/api/masters` permits only the explicit `SQL_MASTER_TYPES` mapped to existing Textilesoft masters. Other types return 503; no generic ERP master table fallback is allowed. | Mixed Master Data screen unavailable. Supported SQL master APIs remain. |
| Audit | `/api/audit-logs` has no compatible mounted SQL route or verified actor/entity/action/change record table. | Unavailable. |
| Sync / restore / tenant administration | No mounted SQL cursor/conflict/device, backup/restore or tenant-admin lifecycle was found. | Unavailable; no Mongo fallback. |
| Discount limits | `GET /api/users` and `PATCH /api/users/:id/discount-limit` are explicitly allowed in SQL-only mode and use existing Textilesoft fields. | Retained as a verified SQL screen. |

The Settings, audit, sync, restore, tenant and mixed master-data screens now render an explicit unavailable state. SQL auth, user, discount-limit, business profile, organization and allowlisted master APIs remain available independently. The HR employee route is not in the SQL-only HTTP allowlist and stays unavailable as recorded in the HR audit.

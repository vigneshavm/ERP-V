# Mongo-free runtime entrypoint audit — 2026-10-02

## Scope and disposition

Static source audit of the server entrypoint, mounted SQL-only API groups, background processes, and current UI route inventory. It complements [the screen inventory](./MONGO_FREE_SQL_SCREEN_INVENTORY_2026-10-02.md); it is not yet the required per-screen UI → API → handler → storage trace.

`backend/src/config/appDataMode.ts` accepts only `APP_DATA_MODE=sql-only` (default). `backend/src/app.ts` mounts the SQL route groups below. The SQL-only gate returns HTTP 503 for paths outside its allowlist before legacy Mongo-backed routers could process them.

| Mounted API prefix | Route source | Scope visible in current mount |
|---|---|---|
| `/api/auth` | `modules/core/routes/auth.routes.ts` | SQL authentication routes |
| `/api/health` | `modules/core/routes/health.routes.ts` | Health checks |
| `/api/users` | `modules/core/routes/userSql.routes.ts` | SQL user paths |
| `/api/masters` | `modules/masters/routes/masterData.routes.ts` | Filtered SQL-compatible master types |
| `/api/customers`, `/api/agents`, `/api/cashiers`, `/api/customer-groups`, `/api/suppliers` | `modules/crm/routes/partiesSql.routes.ts` | SQL party adapters; customer access is read-only in the gate |
| `/api/business` | `modules/core/routes/businessSql.routes.ts` | SQL business profile/setup |
| `/api/branches`, `/api/stores`, `/api/companies`, `/api/warehouses`, `/api/counters` | `modules/core/routes/org.routes.ts` | SQL organization adapters |
| `/api/product-master`, `/api/product-attributes` | `modules/inventory/routes/productMaster.routes.ts` | SQL product master and attributes |
| `/api/purchase-entry` | `modules/purchase/routes/purchaseEntry.routes.ts` | SQL purchase-entry adapter |
| `/api/pos` | `modules/sales/routes/posSql.routes.ts` | SQL POS counter, preview, return-source and invoice-write routes |
| `/api/purchase-returns` | `modules/purchase/routes/purchaseReturnSql.routes.ts` | SQL purchase-return adapter |
| `/api/reports` | `modules/core/routes/reportSql.routes.ts` | SQL reports mounted in this mode |
| `/api/inventory` | `modules/inventory/routes/inventorySql.routes.ts` | SQL inventory reads only |

This list does not prove every menu screen uses these routes. Several components still call legacy prefixes that the current SQL-only server rejects.

## Background and lifecycle entrypoints

| Entry point | Evidence and reachability | Migration disposition |
|---|---|---|
| Backend `server.ts` startup | Starts HTTP server; calls SQL auth setup and duplicate-code/number diagnostics. If `TEXTILESOFT_ADMIN_*` is configured, calls `ensureErpDbAccess`, which creates/alters SQL users and grants permissions. | Active. Elevated SQL admin runtime path is blocker B-07. |
| Backend shutdown/error events | `SIGTERM`, `SIGINT`, unhandled rejection, and uncaught exception handlers close/exit the HTTP server. | Active; no Mongo shutdown dependency is registered in the current SQL-only server entrypoint. |
| Bull email/PDF queues | `backend/src/config/queue.ts` defines processors and `SIGTERM` cleanup. Repository search found no import of this module from active backend code. | Not shown to be live; verify dynamic imports/deployment entrypoints before deleting. |
| Audit enforcement interval | `backend/src/middlewares/auditEnforcement.ts` defines `setInterval(verify, interval)`. No import or mount was found in `backend/src`. | Not shown to be live; keep as an unmounted legacy candidate until import graph is closed. |
| Cache shutdown hook | `backend/src/config/cache.ts` defines a `SIGTERM` listener. No import was found under `backend/src`. | Not shown to be live; verify dynamic imports/deployment entrypoints before deleting. |
| Browser POS offline-sales sync | `useSalesSync` calls `SyncManager.syncOfflineSales`; queued sales live in browser IndexedDB via Dexie and replay to `/api/pos/invoice`. | Active frontend sync path, not MongoDB. Replay safety is blocked while `erp.sales_idempotency` is absent. |
| Browser daily-finance sync | `useFinanceSync` periodically calls `SyncManager.syncDailyFinanceEntries`. | Active client timer; its API routes/data source need page-level classification. |
| Browser failed-sales polling | `POSFailedBills` polls its local failed-sale list every 30 seconds and can trigger queue replay. | Active client timer; tied to POS retry blocker B-02. |
| Browser device-intelligence polling | `DeviceIntelligence` polls its API every five seconds while mounted. | Active client timer; endpoint availability/data source needs page-level classification. |
| Browser dashboard refresh | `Dashboard.tsx` starts a periodic interval while mounted. | Active client timer; dashboard query sources need page-level classification. |
| Browser delayed UI work | POS checkout waits briefly before continuing; other UI one-shot `setTimeout` calls handle state/focus updates. | Interaction timing, not a durable job or server scheduler. |
| Backend transaction retry/timeout | `utils/transaction.ts` uses one-shot timeouts and also imports Mongo transaction/statistics helpers. | Utility reachability and Mongo-dependent call sites still require model/query tracing; not a scheduled task. |
| SQL restore controller | `sync.routes.ts` imports `SqlRestoreController`, but the current SQL-only `app.ts` route list does not mount `sync.routes.ts`; `/api/sync` is not in the SQL-only allowlist. | Not reachable through the currently mounted SQL-only app. Restore code still needs review before deletion. |
| Backup discovery script | `textilesoftSchemaDiscovery.ts` can restore a backup only when explicitly run without `--skip-restore`; the current schema snapshot used `--skip-restore`. | Operator script, not an application background task. Restore/drop flags must not be used for schema evidence tasks. |
| WebSocket/cron/worker services | Static search found no backend WebSocket server, cron scheduler, or standalone worker registration in `backend/src`; payment-reminder source only mentions an assumed cron in a comment. | No active backend worker found by this source scan. |

## Known path dispositions (static)

| Path group or workflow | Current classification | Evidence |
|---|---|---|
| SQL POS counter, preview and bill routes | SQL partial | Mounted SQL route and Textilesoft tables; missing idempotency and return-allocation tables block acceptance. See [POS path audit](./SQL_POS_PATH_AUDIT_2026-10-02.md). |
| SQL inventory reads | SQL partial | Mounted read-only inventory router; its comment excludes categories, serial units, reprint queue, and inventory writes. |
| `/api/sales-invoice/*`, `/api/returns/*`, `/api/estimates/*`, `/api/sales-orders/*`, `/api/delivery-challan/*` | Blocked in SQL-only mode unless an allowed route is mounted | These legacy paths are not in the current `app.ts` SQL-only mount list. |
| Purchase, finance, HR, customer, marketing, combo, audit and sync paths outside the explicit SQL route set | Blocked or SQL partial per route | Route registration and gate must be reconciled with individual screens; similarly named SQL adapters do not establish that a page can reach them. |

## Remaining work for SQL-008, SQL-010 and SQL-011

- SQL-008 remains **In Progress**: the source inventory has menu entries, route patterns and lazy modules, but the page-specific API call → mounted route → controller/service → SQL/Mongo source chain is not complete for all screens.
- SQL-010 remains **In Progress**: the route-group and known-path classifications above are not a complete classification for each screen, model, query and write.
- SQL-011 remains **In Progress**: retained, simplified and unavailable behavior has been written for POS only; other pages need their own functional review.
- No database rows, grants, or schema were changed by this audit.

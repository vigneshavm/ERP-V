# Backend architecture standard

This is the one pattern every backend module follows. Existing modules are migrated to it one
module at a time (routes, controller, service, repository, validation, frontend callers and
tests in the same change) — never by bulk find-and-replace across the codebase.

Reference module: **Purchase** (`src/modules/purchase`) once its migration lands; until then,
`src/modules/sales/controllers/SalesController.ts` shows the controller shape.

## 1. Request flow

```
HTTP request
  → middleware: requestId → tenantResolver (host, optional) → protect (auth + tenant, fails closed)
                → authorize (role/permission) → validation (express-validator chain + validate)
  → controller   HTTP only: read params/query/body, build RequestContext, call service, send response
  → service      business rules, orchestration, transaction boundary
  → repository   MongoDB persistence, always tenant-scoped
    / data source   Textilesoft SQL or other external systems, behind an adapter
```

## 2. Layer rules

### Routes
- One file per resource: `src/modules/<module>/routes/<resource>.routes.ts`, default-exporting an
  `express.Router()`. A module aggregator (`<module>.routes.ts`) mounts its resource routers.
- Every tenant-owned route uses `protect`. Public routes (no signed-in user) are listed in
  §6 and must not read `req.user`.
- Validation chains run before the controller: `router.post('/', protect, createXValidators, validate, controller.create)`.
- Controllers are resolved from the DI container once per file:
  `const controller = container.resolve(XController);` and handlers are passed directly
  (handlers are arrow-function properties, so `this` is bound).

### Controllers
- `@injectable()` classes with arrow-function handler properties.
- Allowed: reading `req.params` / `req.query` / `req.body`, building a `RequestContext`,
  calling one service method, sending the response with the helpers in §3.
- Not allowed: model imports, Mongo/SQL queries, business calculations, transactions,
  inventory or accounting rules, and `res.status(4xx/5xx).json(...)` — errors go to `next(error)`.
- Shape:
  ```ts
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
          const purchase = await this.purchaseService.getById(requestContext(req), req.params.id);
          sendSuccess(res, purchase);
      } catch (error) {
          next(error);
      }
  };
  ```

### Services
- Own business rules, orchestration across repositories/other services, and the Mongo
  transaction boundary (`session` is created in the service and passed down).
- First parameter of every public method is `ctx: RequestContext` (tenant, user, request id).
- Input is a typed DTO (`CreatePurchaseInput`, …), never `any`.
- Signal failures by throwing `AppError(message, status, CODE, details?)`.
- Talk to other domains through their services (Purchase → InventoryService / SupplierService /
  FinanceService), not through the other domain's models. Migration note: direct model
  imports in services are removed module by module; new code must not add them.

### Repositories
- One per aggregate: `src/modules/<module>/repositories/<Entity>Repository.ts` (existing ones in
  `src/repositories/` move as their module is migrated).
- **Every method on tenant-owned data takes `tenantId` and filters by it.** There is no unscoped
  `findById(id)`. Naming: `findById(tenantId, id)`, `list(tenantId, query)`, `create(tenantId, data, session?)`,
  `update(tenantId, id, data, session?)`, `delete(tenantId, id, session?)`.
- Aggregation pipelines must `$match` on `tenantId` as an `ObjectId` (aggregate does not cast).
- Return plain data (`.lean()`) for reads unless the caller needs a document to `save()`.

### Data sources (Textilesoft SQL and other external systems)
- Services never branch on "is this a SQL id / SQL mode". They call an interface
  (e.g. `SalesInvoiceSource.findById`) and a resolver picks the Mongo or Textilesoft adapter.
  Existing example: `src/shared/datasource/`.

## 3. Responses

Helpers in `src/utils/apiResponse.ts`.

| Case | Body |
|---|---|
| Single object / action result | `{ "success": true, "data": { … } }` |
| List | `{ "success": true, "data": [ … ], "pagination": { "page", "pageSize", "total", "totalPages" } }` — `pagination` only when paged |
| Action with no payload | `{ "success": true, "data": null, "message": "Purchase deleted" }` |
| Error (from `errorHandler`) | `{ "success": false, "error": { "code", "message", "details"? }, "message", "code" }` |

- The top-level `message` and `code` on errors mirror `error.message` / `error.code` so the
  frontend's existing `err.response.data.message` reads keep working. They are removed once the
  frontend uses the shared `getApiErrorMessage()` helper everywhere.
- Status codes: 200 read/update, 201 create, 400 validation, 401 unauthenticated,
  403 forbidden / business-rule refusal, 404 not found, 409 conflict, 500 unexpected.
- **Changing a response shape is a breaking change.** The same change updates every frontend
  caller (`grep` the endpoint path under `frontend/src`) and is verified in the browser.

## 4. Errors
- Throw `AppError` for expected failures; anything else is a 500.
- `errorHandler` is the only place that writes error responses. In production it keeps the
  message and `details` for operational `AppError`s with status < 500, and replaces the message
  for 5xx/unexpected errors. Stack traces are logged, never returned.
- Error codes are `UPPER_SNAKE_CASE`, prefixed by entity: `PURCHASE_NOT_FOUND`, `SUPPLIER_INACTIVE`.

## 5. Request context and typing
```ts
interface RequestContext { tenantId: Types.ObjectId; userId: Types.ObjectId; user: IUser; requestId: string; }
```
- Built by `requestContext(req)` in controllers; services and repositories receive it (or its
  `tenantId`) instead of `req`.
- `req.user` (`IUser`) and `req.tenantId` (`ObjectId`) are declared on every Express `Request`
  (`middlewares/authMiddleware.ts`, `middlewares/tenantResolver.ts`). Do not redeclare them in
  local interfaces and do not use `(req as any).user`.
- `any` is not allowed in new or migrated code except at a documented boundary (third-party
  payloads before validation).

## 6. Tenancy
- `protect` rejects: missing/invalid token (401), unknown user (401), user without a tenant
  (403, except platform super-admins on `/api/admin`).
- `tenantResolver` only resolves the tenant from the host for public storefront routes; it never
  grants access. Routes that need a tenant but have no signed-in user use `requireTenant`.
- Public routes (no `protect`): `/api/health`, `/api/auth/*` login/register/refresh,
  `/api/business-sectors`, `/api/product-categories`, public storefront endpoints.
- Every tenant-owned repository has a test proving tenant A cannot read tenant B's records.

## 7. Dependency injection
- `@injectable()` for controllers, services and repositories (stateless). The container is the
  single place instances come from; do not `new` a service.
- `@singleton()` only for classes that hold shared state or resources (connection pools, caches),
  with a comment saying why.

## 8. Logging
- `import { info, warn, error, debug } from '../config/logger.js'` (adjust path). No `console.*`
  in `src/` outside `src/scripts/`.
- Include `requestId`, `tenantId`, `userId` and the entity id in the meta object where available:
  `info('Purchase created', { requestId, tenantId, purchaseId })`.
- Replacing `console.*` is done file by file with an import check (`tsc`), never by bulk regex.

## 9. Validation
- express-validator chains per endpoint in `src/modules/<module>/validators/<entity>Validators.ts`
  (`createPurchaseValidators`, `updatePurchaseValidators`, …) followed by the `validate` middleware.
- Services may still enforce business rules (credit limit, stock) but not field presence/shape.

## 10. Configuration
- Environment-specific behaviour is configured, not hard-coded: Mongo pool sizes
  (`MONGO_MAX_POOL_SIZE`, `MONGO_MIN_POOL_SIZE`, `MONGO_SERVER_SELECTION_TIMEOUT_MS`) and the DNS
  override (`MONGO_DNS_SERVERS`, off unless set).

## 11. Tests
- Jest runs `*.test.ts` and `*.test.js` under `backend/tests/` and `backend/src/**/tests/`.
- Each migrated module has: service unit tests for its business rules, and a tenant-isolation
  test for each repository.
- A module is done only when `tsc --noEmit` passes for backend and frontend and `npm test` passes.

## 12. Project layout
- `src/` holds deployable application code only. One-off scripts (seed, migration, diagnostics,
  Textilesoft analysis) live in `backend/scripts/<kind>/`.
- `dist/` is build output: git-ignored, never committed or zipped.

## 13. Definition of done (per module)
- [ ] Routes: one file per resource, `protect` on tenant routes, validators before controller
- [ ] Controllers: no model imports, no business logic, `next(error)`, response helpers only
- [ ] Services: typed DTO inputs, `RequestContext` first, business rules and transactions here
- [ ] Repositories: every tenant-owned method takes `tenantId`; no unscoped lookups
- [ ] Textilesoft/SQL access behind a data-source adapter
- [ ] Responses match §3; all frontend callers updated and checked in the browser
- [ ] No new `any`, no `console.*`, no `(req as any)`
- [ ] Unit tests for business rules; tenant-isolation test per repository
- [ ] Backend and frontend `tsc --noEmit` pass; `npm test` passes

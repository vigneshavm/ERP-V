# ARCHITECTURE.md — ERP System Architecture

This document describes the actual, current structure of this repository. It reflects the codebase
as inspected on 2026-09-03, after the frontend's `pages/` → `features/` migration. Keep it in sync
when structure changes — an architecture doc that lies is worse than none.

For the mandatory coding rules (how to write code within this structure), see `CODING_PRINCIPLES.md`.
For AI-agent-specific workflow rules, see `CLAUDE.md` and `AGENTS.md`.

## 1. Repository Layout

```
ERP/
├── frontend/     React 19 + TypeScript + Vite SPA
├── backend/      Express 4 + TypeScript API (MongoDB/Mongoose)
├── docs/         Design docs, reviews, and process docs (CODE-QUALITY.md, TESTING.md, SONARQUBE.md, ...)
├── DB/           Database-related assets
├── Data_Seed/    Seed data
└── api/          (see note below — verify current purpose before relying on it)
```

`frontend/` and `backend/` are independent npm packages with their own `package.json`, `tsconfig.json`,
and `eslint.config.js`. A root-level `eslint.config.js` and root `node_modules` also exist and are used
to lint `backend/` (see "Tooling notes" below).

## 2. Frontend Architecture (`frontend/src`)

Feature-first organization:

- **`features/<domain>/`** — one folder per business domain: `auth`, `tenants`, `customers`,
  `employees`, `payroll`, `suppliers`, `purchase`, `sales`, `pos`, `inventory`, `finance`,
  `financial`, `expenses`, `marketing`, `customer-engagement`, `reports`, `dashboard`, `system`,
  `business`, `commercial`, `online-store`. Each domain preserves whatever internal subfolders
  (`components/`, `hooks/`, `Modals/`, etc.) it already had. There is no `pages/` directory —
  it was fully migrated into `features/` on 2026-09-03.
- **`components/shared/`** — cross-domain UI: `Layout` (Sidebar, ModuleRenderer, RouteDefinitions,
  GlobalModals, `TenantView.tsx` — the logged-in app shell), `Modals`, `Table`, `core/` primitives
  (Display, Feedback, Form).
- **`redux/`** — Redux Toolkit store. `slices/` (24 domain slices), `thunks/`, `middleware/`,
  `rootReducer.ts`, `store.ts`. Centralized, not duplicated per feature.
- **`services/`** — API clients and cross-cutting services. **`services/ModuleRegistry.ts` is the
  single lazy-import map** consumed by the app's custom `viewMode`-driven router
  (`ModuleRenderer` / `RouteDefinitions` in `components/shared/Layout/`). This is NOT a
  React-Router route table — navigation is driven by a `viewMode` string matched against this
  registry's keys. **Any feature/page relocation must update its entry here**, or the module
  silently fails to lazy-load.
- **`types/`, `utils/`, `hooks/`, `contexts/`, `data/`, `config/`, `validations/`** — centralized,
  shared across features, not nested per-feature.
- **`App.tsx`** — top-level view orchestrator. Defines `LandingPage` and `AdminView` as local
  module-scope components (not separate files) and switches between Landing / Admin / TenantView
  based on auth state and `viewMode`.

### Dependency direction (frontend)

```
App.tsx → features/* → components/shared → redux / services / types / utils
```

A feature must not import another feature's internals directly. Cross-feature reuse goes through
`components/shared/`, or the target code is genuinely shared and belongs in one of the centralized
folders above, not copied.

### State/data stack

- **Redux Toolkit** — primary domain state (24 slices as of this writing).
- **TanStack Query** — server-state synchronization/caching for reads not modeled in Redux.
- **Dexie (IndexedDB)** — underpins `SyncManager` for offline-first behavior; do not bypass it for
  data that must survive offline/reconnect cycles.

### Path alias

`@/*` resolves to `./src/*` (see `frontend/tsconfig.json` `compilerOptions.paths`). Both relative
(`../../foo`) and `@/foo` import styles exist in the codebase; prefer whichever the file you're
editing already uses.

### Known gap

`docs/Architecture_Review.md` predates the `features/` migration and describes an earlier state
(claims `src/features` is empty and references `pages/Views/TenantView.tsx`). Treat this file as a
historical review, not current fact — this ARCHITECTURE.md is the current source of truth for
frontend structure. Its non-structural recommendations (TenantView decomposition, Redux lazy
reducers, Zod expansion) may still be live and worth reading.

## 3. Backend Architecture (`backend/src`)

Domain-module organization, one level deeper than the frontend's:

- **`modules/<domain>/`** — one folder per business domain: `core`, `crm`, `expense`, `finance`,
  `hr`, `inventory`, `marketing`, `purchase`, `reports`, `sales`, `sms-tracker`, `store` (and more —
  verify current list with `ls backend/src/modules` before assuming completeness). Each module
  contains its own `controllers/`, `services/`, `models/`, `routes/` (a module may omit a folder it
  doesn't need — e.g. `reports/` has only `services/`).
- **`repositories/`** — a smaller, separate set of repository classes at `src/repositories/`
  (`CustomerRepository.ts`, `InventoryRepository.ts`, etc.) implementing a repository pattern over
  some models. Not every module uses this layer; check whether a domain already has a repository
  before adding data-access logic directly in a controller or service.
- **`interfaces/`** — shared TypeScript interfaces for core data shapes (`ICustomer.ts`,
  `IInvoice.ts`, `IUser.ts`, etc.), separate from per-module model files.
- **`middlewares/`** — Express middleware (auth, validation, observability, rate limiting, etc.).
- **`config/`** — environment/infra config: `database.ts`, `cors.config.ts`, `jwt.ts`, `logger.ts`,
  `queue.ts`, `sentry.ts`, `swagger.ts`, `validateEnv.ts`, `deploymentGates.ts`.
- **`v2/`** — a newer, apparently in-progress area (currently just `v2/models`). Check its actual
  contents and intent before adding to it or assuming it's fully wired up.
- **`app.ts`** — Express app assembly (middleware registration, route mounting).
- **`server.ts`** — process entry point (listens, connects DB, etc.).
- **`scripts/`** — one-off/maintenance scripts (seeding, migrations, index creation) invoked via
  the `npm run seed:*`, `migrate:*`, `indexes:create` package scripts.

Two other backend-adjacent directories exist at the repo/backend root: `backend/apps/` and
`backend/budget-planner-api/` — these read as separate/sub-projects, not part of the main
`src/modules` domain layout. Confirm their purpose and ownership before touching them; they were
excluded from the root-level ESLint config's scope (see Tooling notes) for exactly this reason.

### Dependency direction (backend)

```
routes → controllers → services → (repositories | models directly)
```

Stack: Express 4, TypeScript (strict — `noUnusedLocals` / `noUnusedParameters` enabled),
Mongoose/MongoDB, ESM (`"type": "module"` in `package.json` — no bare `require()`; use `import`,
even for conditional/dynamic loading).

## 4. Tooling Notes

- **Frontend build**: `npm run build` runs `tsc --noEmit && vite build`. `tsc` is the authoritative
  type-check; a passing `tsc --noEmit` with a failing `vite build` usually means an environment
  issue (e.g. platform-mismatched `esbuild` binary), not a code problem — verify before assuming
  the code is broken.
- **Frontend tests**: Vitest (`npm test`, `test:watch`) for unit/component tests, Playwright
  (`test:e2e`) for end-to-end.
- **Backend tests**: Jest (`npm test`, requires a live MongoDB connection — see `docs/TESTING.md`).
- **Backend lint**: `backend/` has its own `eslint.config.js` (ESLint 9 flat config). It is invoked
  via the monorepo root's ESLint 9 + typescript-eslint binary (`node_modules/.bin/eslint` at repo
  root), NOT via any `backend/node_modules/.bin/eslint`, which resolves to an incompatible hoisted
  config. Run lint from `backend/` so the flat-config walk-up finds `backend/eslint.config.js`
  first.
- **`tsc` binary**: `backend/` has its own local `tsc`. `frontend/` does not always have one at
  `frontend/node_modules/.bin/tsc` — the monorepo root's `node_modules/.bin/tsc` works against
  either subproject via `tsc --noEmit -p .` run from that subproject's directory.
- **SonarQube/SonarCloud**: see `docs/SONARQUBE.md`.

## 5. Verifying a Structural Change

Before committing any change that moves, renames, or restructures files:

1. `tsc --noEmit -p .` in the affected subproject — must be 0 errors.
2. ESLint scoped to the affected paths — compare against the pre-existing baseline; only flag
   *new* issues, since both subprojects carry pre-existing lint warnings/errors unrelated to your
   change (react-hooks rules, unused vars) that are out of scope to fix opportunistically unless
   asked.
3. Frontend only: if you moved anything under `features/` or `components/`, grep
   `services/ModuleRegistry.ts` and `App.tsx` for stale paths to the old location.
4. Grep the whole tree for both relative (`../`) and alias (`@/`) import styles pointing at the old
   location — a partial fix that only catches one style leaves broken imports.

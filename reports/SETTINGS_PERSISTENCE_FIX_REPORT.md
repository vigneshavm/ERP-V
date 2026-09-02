# Settings Persistence Fix — Final Report

**Scope:** SmartERPAI – Enterprise Manager, `/settings/*` pages (General, Branding, Finance tabs) and the underlying Tenant record in MongoDB.

## 1. Gap analysis (what was actually broken)

Settings.tsx's Save button called `dispatch(updateTenantDetails(...))`. That action, in `tenantSlice.ts`, was a **plain synchronous Redux reducer** — it merged the new values into `state.tenants` in memory and did nothing else. No `fetch`/`axios` call, no backend route hit, nothing written to MongoDB. `redux-persist` is not configured in `store.ts` either, so the "saved" values didn't even survive a hard refresh — they only *looked* saved because the toast fired unconditionally.

Meanwhile a **working, DB-backed Settings API already existed** and was reused per your instruction rather than replaced:
- `GET /api/settings` / `PUT /api/settings` → `SettingsController.ts` → real `Tenant` Mongoose document, scoped by `req.tenantId` (set by the `protect` auth middleware from the logged-in user's `tenantId`).
- It was mounted correctly (`core.routes.ts` → `/api`), but only covered a handful of fields (`appName`, `businessType`, flat address/contact) — nowhere near what the Settings UI and the frontend `Tenant` TypeScript type actually expect (`sector`, `primaryColor`, `loginLogoUrl`, `theme`, `companyDetails`, `taxDetails`, `bankingDetails`, etc.). The backend `Tenant` Mongoose schema didn't have most of those fields at all — pure schema drift between frontend types and backend model.

Also found and reconciled from a related earlier fix: `Tenant.sector` (short code, e.g. `Textile`) and `Tenant.businessType` (long display name, e.g. `Textile & Garments Retail`) are two different string spaces. Settings.tsx already resolves `businessType` → `sector` via `/api/business-sectors` before saving; this fix makes sure that resolved value is now the one that actually reaches MongoDB.

A separate, fully-unwired "dynamic configuration" system was also found (`ConfigController`/`SystemConfig`/`TaxMaster`/`LoyaltyRule` — real DB-backed key/value config, but no route file mounts it anywhere). It's related to your "tax/loyalty/inventory config shouldn't be hardcoded" concern but is a materially separate subsystem from Tenant/Settings. I did not wire it in — doing so safely would mean designing the UI surface for it, which is outside what "fix Settings persistence" asked for. Flagging it as a follow-up candidate.

## 2. What was implemented

**Backend**
- `backend/src/modules/core/models/Tenant.ts` — added optional fields the frontend already expects: `sector`, `primaryColor`, `loginLogoUrl`, `loginBgUrl`, `theme`, `companyDetails{}`, `taxDetails{}`, `bankingDetails{}`, `systemConfig{}`, `defaultTaxMode`, `enabledModules`. All additive — the legacy `address`/`contact`/`gstNumber`/`panNumber` fields are untouched (kept as fallback sources) so nothing else reading them breaks.
- `backend/src/modules/core/controllers/SettingsController.ts` — rewritten:
  - `getSettings`: returns the full tenant record in the shape the frontend `Tenant` type expects, falling back to legacy fields for tenants that predate this change.
  - `updateSettings`: validates `name`/`appName` is non-empty (400 if not), strips any `tenantId`/`id`/`_id` from the request body before touching anything (always scoped to `req.tenantId` from the auth token — a request can't smuggle another tenant's id), merges nested objects (`companyDetails`/`taxDetails`/`bankingDetails`/`systemConfig`) instead of overwriting them so a partial save never wipes sibling fields, `tenant.save()`s, and returns the saved record so the frontend syncs from the authoritative source.
- `backend/src/modules/core/routes/settingsRoutes.ts` — `PUT /` now requires `authorize('owner','co-owner','admin')` (matches the same role list already used by `auditLogRoutes.ts`); `GET /` stays open to any authenticated tenant member.

**Frontend**
- `frontend/src/redux/slices/tenantSlice.ts` — added two real thunks:
  - `fetchTenantSettings` — `GET /api/settings`, merges the response into `state.tenants`.
  - `saveTenantSettings` — `PUT /api/settings`, merges the response into `state.tenants` **only on success**. Both follow the same `state.auth.user?.token` / `Authorization: Bearer` pattern already used by `inventorySlice.ts`, so there's no new auth mechanism to learn.
- `frontend/src/pages/System/Settings/Settings.tsx`:
  - Load flow: a `useEffect` on mount dispatches `fetchTenantSettings()`; a second `useEffect` (keyed on `activeTenant.updatedAt`, which only changes when the server confirms a fetch/save) re-hydrates every local form field from the DB-backed tenant — this is what makes "browser B refreshes and sees browser A's save" actually work.
  - Save flow: `handleSave` now `await`s `dispatch(saveTenantSettings(tenantUpdates)).unwrap()` before doing anything else. The success toast only fires after that resolves; on rejection, the real error message is shown and every local field is left exactly as the user typed it (local `useState` was never touched by the old code either, so this was already safe — now it's actually meaningful because saves can really fail). The old direct `dispatch(updateTenantDetails(...))` optimistic-only call was removed so Redux is never ahead of MongoDB. The already-real Profile-tab save (`updateProfile`) is untouched and also now awaited so profile-save errors surface, too.

## 3. API endpoints

| Method | Path | Change |
|---|---|---|
| GET | `/api/settings` | Extended response shape (was a handful of flat fields, now the full Tenant-settings shape) |
| PUT | `/api/settings` | Extended accepted fields; added `authorize('owner','co-owner','admin')`; added name validation; added tenant-scoping hardening; now returns the saved record |

No new routes were created — both were reused as instructed.

## 4. DB / model changes

`Tenant` collection (Mongoose model) gained these optional fields (backward compatible, no migration needed — Mongoose just returns `undefined`/defaults for documents that predate this change, and `getSettings` falls back to the legacy `address`/`contact` fields for those):

`sector`, `primaryColor`, `loginLogoUrl`, `loginBgUrl`, `theme`, `companyDetails{addressLine1,city,state,pincode,country,stateCode,phone,email,website}`, `taxDetails{gstin,pan,taxSystem,isGstEnabled}`, `bankingDetails{bankName,accountNumber,ifsc,accountHolderName}`, `systemConfig{pricingMode}`, `defaultTaxMode`, `enabledModules`.

## 5. Business Sector → Product Category (carried over from the earlier fix, verified still consistent)

`BusinessSector.shortCode` bridges `Tenant.sector` (short code) and `BusinessSector.name` (long display name); `ProductCategoryModel` rows are keyed to a `BusinessSector`. `SET-012` (below) specifically locks in that saving a sector through the new Settings API keeps that mapping intact.

## 6. Tests added

**Backend — `backend/tests/settingsPersistence.test.js`** (SET-001…SET-013), run against a real in-process MongoDB via `mongodb-memory-server` (the project's existing `tests/setup.js`), calling the *compiled* controller functions directly (same pattern as the existing `reportControllerTenantScoping.test.js`) plus one `supertest` call against the real Express app:

- SET-001 — GET returns persisted sector/businessType
- SET-002 — PUT persists sector/businessType/companyDetails, verified by **re-reading from the DB independently of the controller's own response**
- SET-003 — a later GET reflects an earlier PUT (cross-request persistence)
- SET-004 — empty/invalid name → 400, DB untouched
- SET-005 — missing tenant context → 400
- SET-006 — cross-tenant isolation: tenant A's update never touches tenant B, even if the request body tries to smuggle tenant B's id
- SET-007 — unknown tenantId → 404
- SET-008 — partial nested update (only `city`) merges instead of wiping `companyDetails`
- SET-009 — Finance tab fields (GSTIN/PAN/banking) persist
- SET-010 — malformed tenantId handled gracefully, no crash
- SET-011 — simulated DB failure (`Tenant.findById` throws) → clean 500, not a crash
- SET-012 — saved `sector` stays resolvable against `BusinessSector.shortCode`
- SET-013 — unauthenticated `GET /api/settings` → 401 over the real HTTP/middleware stack

**Frontend — `frontend/src/redux/slices/tenantSlice.settings.test.ts`** (SET-FE-001…005), vitest, mocking `services/api`:

- SET-FE-001 — `fetchTenantSettings` calls `GET /api/settings`, merges result into Redux
- SET-FE-002 — `saveTenantSettings` calls `PUT /api/settings`, merges the **server's** response (not the optimistic payload)
- SET-FE-003 — backend `success:false` → thunk rejects, Redux untouched
- SET-FE-004 — network/server error → thunk rejects with the real message
- SET-FE-005 — no auth token → rejects with "Not authenticated", API never called

## 7. Test results — IMPORTANT, please read

I could not execute these myself. This session has no shell access on your machine (no `device_bash` in this environment — only file read/write/staging), so I cannot run `npm run build`, `npm test`, or `npx playwright test` there, and I did not attempt to fabricate pass/fail numbers. What I can tell you honestly:

- Every test above is real, runnable code written against your actual compiled-controller / real-in-memory-Mongo test conventions (not pseudocode).
- I traced every field name and merge path by hand against the actual `Tenant.ts` schema I wrote and the actual `SettingsController.ts` I wrote, and against the existing `reportControllerTenantScoping.test.js` pattern for the mocking/req-res shape — so these should run cleanly, but "should" isn't "did."

**To get real numbers, please run, in `backend/`:**
```
npm run build
npm test -- settingsPersistence.test.js
npm test          # full regression suite, to compare against your pre-existing baseline
```
and in `frontend/`:
```
npm test -- tenantSlice.settings.test.ts
npm test          # full regression suite
```
If anything fails, paste the output back to me and I'll fix it directly — I'd rather do that than hand you invented numbers.

## 8. Hardcoded/mock value audit along the Settings path

- `GeneralTab.tsx` has a 4-sector hardcoded fallback array (`Textile & Garments Retail`, `Electronics Store`, `Pharmacy`, `Supermarket`) — but it's genuinely a **network-failure fallback**, only used inside the `catch` block if `GET /api/business-sectors` itself fails. Normal operation is 100% DB-driven. Left as-is; flagging it because it's the one place that superficially looks like hardcoded production data.
- `settingsSlice.ts`'s `initialSettingsState` (default app name "Enterprise Manager", default primary color, default enabled-modules flags, and a large hardcoded RBAC permission-by-role matrix) are pre-DB-load UI defaults, not something masquerading as persisted data — they get overwritten by `fetchTenantSettings` on load for the fields this fix covers. The RBAC permission matrix itself is a separate, pre-existing system (role→view permissions) that is out of scope for "Settings persistence" as you defined it, but is the same *pattern* of hardcoded-should-be-DB-driven data — worth a dedicated follow-up if you want it.
- No hardcoded tenant IDs, test emails, or placeholder GST/tax numbers were found anywhere in the Settings save/load path.
- The previously-flagged unwired `ConfigController`/`TaxMaster`/`LoyaltyRule`/`SystemConfig` system (real DB-backed tax/loyalty/inventory config, but no route ever mounts it) is still unwired. It's related to your "tax, loyalty, inventory config" wording but is a distinct subsystem from Tenant/Settings — I did not wire it into this fix since that's a materially bigger, separate change (new UI surface + route file + decision on how it relates to `taxDetails`/`systemConfig` I just added). Flagging for a follow-up conversation.

## 9. E2E — feasibility assessment (why there's no `E2E-SET-001` Playwright spec)

I looked for an existing authenticated Playwright pattern to extend (the two existing specs, `ui-navigation.spec.ts` and `inventory-search.spec.ts`, never log in — they just hit routes). There isn't one yet. A genuine authenticated Settings E2E test needs: a live backend with a real Mongo connection, a real login flow (the `protect` middleware also requires a matching `deviceId` cookie, not just a JWT), and either a seeded test user/credentials or a register-then-login sequence. `playwright.config.ts`'s `webServer` only boots the frontend dev server, not the backend, so even a correctly-written spec wouldn't run standalone in this repo yet.

Rather than write Playwright code I have no way to execute or verify (wrong selectors or a misunderstood login flow would be worse than nothing), I'm flagging this as the one item I did not implement. If you want it, the fastest path is: tell me (or let me inspect) the login page's field names/route, and whether there's a seeded test tenant/user I can point the spec at — I'll write and hand you a real `E2E-SET-001` spec covering: log in as browser A → change Business Sector + a company detail on `/settings/general` → save → see the success toast → open a second browser context (or log out/in) → confirm both values are still there.

## 10. Remaining limitations

- Backend/frontend/E2E regression numbers are **not yet run** — see §7 for exact commands.
- The RBAC permission matrix and the unwired dynamic-configuration system (tax/loyalty/inventory) are both real, DB-capable systems that remain outside this fix's scope; flagged above for a deliberate follow-up rather than folded in silently.
- Authenticated E2E coverage for Settings does not exist yet (§9) — needs either your input on login/test-user details, or a decision to defer it.
- I did not modify `settingsSlice.ts`'s RBAC/module defaults or attempt to wire `ConfigController` — both were judged out of scope for "fix Settings persistence," per your instruction not to invent new architecture beyond what was asked.

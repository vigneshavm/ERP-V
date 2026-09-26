# E2E test suite (Playwright)

End-to-end tests for the ERP frontend, built on `@playwright/test` (already a devDependency —
nothing new to add to `package.json` beyond a couple of convenience scripts).

## What's here

| File | Covers |
|---|---|
| `fixtures.ts` | Shared `test`/`expect`, wires up API mocks + an authenticated session before every test |
| `helpers/mocks.ts` | The mocking layer: session seeding + a `page.route('**/api/**', ...)` handler |
| `auth.spec.ts` | Login form validation, failed/successful login, logout |
| `pos-checkout.spec.ts` | POS terminal: add to cart, checkout, GST-on-invoice regression check |
| `purchase-grn.spec.ts` | Create a Purchase, then receive it via GRN |
| `inventory-master-data.spec.ts` | Register a product, HSN Code → GST Rate auto-fill |
| `navigation-smoke.spec.ts` | Route-level smoke test for every module *not* already covered by `ui-navigation.spec.ts` |
| `inventory-search.spec.ts`, `ui-navigation.spec.ts` | **Pre-existing** — untouched. `navigation-smoke.spec.ts` was written to complement, not duplicate, `ui-navigation.spec.ts`'s route list. |

## Why everything is API-mocked

`inventory-search.spec.ts` (already in the repo before this suite) established the pattern: seed
an authenticated session directly into `localStorage` (matching `utils/session.ts`'s
`setSession()`) and intercept every `/api/**` call, rather than running against a live backend +
seeded database. The new specs follow the same convention, factored into `fixtures.ts` /
`helpers/mocks.ts` so it isn't copy-pasted per file. Concretely, this means:

- **You only need the frontend dev server running** (`npm run dev` inside `frontend/`) — no
  backend, no MongoDB, no seed data. `playwright.config.ts`'s `webServer` block starts it for you.
- Tests that need to verify a real write (creating a purchase, receiving a GRN, adding a product,
  charging GST at checkout) intercept the *specific* endpoint and assert on the outgoing request
  body — so they're still exercising real app logic (form → Redux thunk → HTTP call), not just
  static UI state.
- `apiMocks` (see `fixtures.ts`) is a per-test/per-describe override point:
  `test.use({ apiMocks: [...] })` layers extra mocks in front of the generic fallback in
  `helpers/mocks.ts`, which returns an empty 200 for anything not explicitly handled (set
  `DEBUG_E2E_MOCKS=1` to log which URLs hit that fallback — the fastest way to find what a new
  test needs to mock). With two or more mocks, wrap the list:
  `test.use({ apiMocks: [[mockA, mockB], { scope: 'test' }] })` — Playwright reads a bare
  two-element array as `[value, options]`, which silently drops all but the first mock.

To test against a **real backend** instead: skip the `apiMocks`/session-seeding fixture for that
spec, do a real login (see the "real backend" note inline in `auth.spec.ts` if you add one), and
use Playwright's [`storageState`](https://playwright.dev/docs/auth) to persist the session across
tests instead of `seedAuthSession`.

## Running the tests

```bash
cd frontend
npm install                        # first time only
npx playwright install chromium    # first time only — downloads the bundled browser

npm run test:e2e                   # headless, uses the system chrome/msedge channels
npm run test:e2e:chromium          # headless, uses the bundled Chromium (works without a system Chrome/Edge install)
npm run test:e2e:headed            # headed (watch the browser)
npm run test:e2e:ui                # Playwright's interactive UI mode — best for writing/debugging
npm run test:e2e:report            # opens the last HTML report
```

Useful flags (any script above, via `npx playwright test ...`):

```bash
npx playwright test auth.spec.ts                 # one file
npx playwright test -g "logs in successfully"     # one test, by title
npx playwright test --project=chromium            # pick a browser project
PWDEBUG=1 npx playwright test auth.spec.ts        # step through with the Playwright inspector
DEBUG_E2E_MOCKS=1 npx playwright test             # log unmocked /api/** calls
```

`playwright.config.ts` already sets `workers: 1` and `fullyParallel: false` (matches the existing
config's choice — the app's local-first Dexie/IndexedDB layer and shared dev-server state make
parallel runs riskier here) and picks up `PORT` if you're running Vite on something other than
3000 (`PORT=3001 npm run dev` + `PORT=3001 npx playwright test`).

## CI

Added an `e2e-check` job to `.github/workflows/ci.yml`, after `frontend-check`, using the
`chromium` project (bundled browser via `playwright install --with-deps chromium`, so it doesn't
depend on GitHub's runner image happening to have Chrome/Edge installed) and uploading the HTML
report as a build artifact on every run (pass or fail) so a failure is debuggable from the Actions
UI without re-running locally.

## Things worth knowing / known gaps

- **Fixed a pre-existing config bug**: `playwright.config.ts`'s `BASE_URL` used to default to port
  **3001**, but `vite.config.ts`'s dev server listens on **3000** and nothing set `PORT=3001` for
  Vite. A cold `npm run test:e2e` (no dev server already running) would start Vite on 3000 while
  Playwright polled 3001, and just time out after 120s — masked whenever a dev server happened to
  already be running on 3000 (`reuseExistingServer: true`). Now defaults to 3000, matching Vite.
  Also made the `webServer.command` cross-platform (`cmd /c npm run dev` only worked on Windows;
  CI runs on Ubuntu) — override via `PORT=<port>` if you deliberately run Vite elsewhere.
- **No `data-testid` attributes exist anywhere in the codebase.** Every selector here is
  text/placeholder/role/attribute-based (`getByPlaceholder('Type to search...')`,
  `button[title="CASH"]`, `select[name="hsnCode"]`, etc.), pulled directly from the actual
  component source, not guessed. That's inherently more brittle to copy/UI changes than
  `data-testid` would be — worth adding test ids to the highest-traffic screens (POS, Purchase
  Entry, Login) as a follow-up if this suite is going to be relied on long-term.
- **I could not execute these tests end-to-end myself** — the sandboxed shell used to inspect and
  write this suite has no path to a real or bundled Chromium (browser download and any system
  Chrome/Edge are both unreachable from it), so I verified with `npx playwright test --list`
  (confirms every file parses and every test is discovered with zero syntax/type errors — 246
  tests across the 7 spec files) and by reading the actual source for every selector, endpoint,
  and payload shape referenced (Login.tsx, useLoginForm/useAuthActions, PurchaseEntry.tsx,
  useGRNForm.ts, ProductModal.tsx, usePOSCheckout.ts, posInvoiceMapper.ts, etc. — not assumed).
  Please run `npm run test:e2e:chromium` (or `test:e2e:headed` to watch it) once locally before
  trusting this as a merge gate — if anything's drifted from what the code showed at write time,
  flag it and it's a quick fix, not a rewrite.
- The POS checkout test asserts the invoice payload's `tax` field matches the product's
  `gstRate` — this is a direct regression check for the charged-vs-recorded GST mismatch
  documented in project memory (`erp_pos_gst_tax_bug_fix.md`); worth keeping even if other tests
  here get trimmed later.

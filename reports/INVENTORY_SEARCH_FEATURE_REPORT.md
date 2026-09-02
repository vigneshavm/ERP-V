# Inventory Search & Filter — Implementation Report

**Scope:** SmartERPAI – Enterprise Manager. User story: "As an Inventory Manager, I need to find the available quantity of shirts in inventory and filter them by size, brand, shelf/full-or-half shelf, and color."

## 1. What I found already in the repo (important — read this first)

Before writing anything, I checked for an existing implementation, and found this feature was already substantially underway: a `Brand`, `Size`, `Color`, and `Shelf` Mongoose model (matching your recommended normalized schema almost exactly), an `Item` schema already carrying `brand`/`size`/`color`/`shelfCode`/`shelfType` fields, a `getAllItemsWithPagination` service method that already filtered by all of these, and a full `InventoryVariantSearch.tsx` page matching your wireframe closely — already routed at `/inventory/search`. None of this was mentioned in earlier conversation history, so it was either built by someone else on your team or another tool working on this repo. I built on top of it rather than starting over, per the same "don't invent a new architecture" principle from the Settings fix.

That said, the existing version had real problems, which is what most of this report covers:

- A genuine correctness bug: combining a product-name search with a shelf filter silently dropped the search text (both wrote to the same MongoDB `$or` key, and the second overwrote the first).
- The frontend page had a hardcoded fallback (`getFallbackItems()`) that displayed fake demo stock rows whenever the real API call failed — indistinguishable from real inventory to an Inventory Manager relying on it.
- Hardcoded `DEFAULT_BRANDS`/`DEFAULT_SIZES`/`DEFAULT_COLORS`/`DEFAULT_SHELVES` arrays were unconditionally merged into the filter dropdowns, and a client-side re-filter step guessed missing item fields as `'Peter England'`/`'Blue'`/`'M'`/`'A-03'` — both violate "don't store this as static frontend data."
- The `Brand`/`Size`/`Color`/`Shelf` catalog collections existed but had no route, no controller, no seed data, and were never queried by anything — orphaned scaffolding.
- The page's route existed, but the nav menu had no link to it — reachable only by typing the URL directly.
- `getDistinctCategories` (the sibling function for the Categories filter) had the same class of hardcoded-fallback issue baked into the backend itself, not just the frontend.

## 2. What was implemented

**Backend**
- `InventoryService.getAllItemsWithPagination` — fixed the `$or` collision: search and shelf filters are now combined with `$and` so both apply together correctly.
- `InventoryService.getAllItemsWithPagination` — every returned item now carries a real `availableQuantity` field (`stockQty - reservedStock`, floored at 0). This was previously silently missing: the query uses `.lean()` for performance, which strips out Mongoose's `availableStock` virtual, so the "available quantity" number the spec asks for didn't actually exist anywhere in the API response.
- `InventoryService.getFilterOptions` (new) — returns real Brand/Size/Color/Shelf option lists, sourced from the `Brand`/`Size`/`Color`/`Shelf` catalog collections unioned with whatever values the tenant's own Items already use. No hardcoded arrays anywhere; an empty catalog and no items returns empty arrays, not fabricated defaults.
- `InventoryController.getFilterOptions` (new) + `GET /api/inventory/filters` route — exposes the above to the frontend.
- `InventoryService.getDistinctCategories` / `InventoryController.getDistinctCategories` — removed the hardcoded `['Clothing', 'Electronics', ...]` fallback that fired on both an empty result and a real error; now returns `[]` and a proper 500 respectively, consistent with every other error handler in that file.
- `backend/src/scripts/seedInventoryFilters.ts` (new, `npm run seed:inventory-filters`) — seeds the `Brand`/`Size`/`Color`/`Shelf` catalog with a real starter set (the same values that used to be hardcoded in the frontend, now living in MongoDB instead).

**Frontend**
- `InventoryVariantSearch.tsx` — removed `getFallbackItems()` entirely; a failed API call now shows a real "Couldn't load inventory" error state with the actual error message and a Retry button, never fake rows. Removed the hardcoded `DEFAULT_*` arrays; filter dropdowns are now populated from `GET /api/inventory/filters` only. Removed the client-side re-filter step that guessed missing brand/size/color/shelf values — the table now trusts the server's filtered, real data directly, and shows "—" for a genuinely unset field instead of a guessed default. Available Qty now reads the server's `availableQuantity`.
- `config/menu.config.ts` — added a "Variant Search" entry under the Inventory nav group (path `/inventory/search`) so the page is actually discoverable, not just reachable by typing the URL.
- `types/common.ts` and `redux/slices/settingsSlice.ts` — added the new `INVENTORY_SEARCH` permission id and granted it to Owner, Co-Owner, Admin, and Staff (the same roles that already have `INVENTORY_ITEMS`), so the nav entry actually renders for those roles.

## 3. API

| Method | Path | Status |
|---|---|---|
| GET | `/api/inventory` | Already existed; fixed (see §2) and extended with `availableQuantity` per item. Params: `search`, `brand`, `size`, `color`, `shelf`/`shelfCode`, `shelfType`. |
| GET | `/api/inventory/filters` | New. Returns `{ success, data: { brands, sizes, colors, shelves } }`. |

## 4. Test scenarios (INV-SRCH-001 to INV-SRCH-014)

`backend/tests/inventoryVariantSearch.test.js` covers all fourteen, plus two extra tests for the new filter-options endpoint (empty-catalog case, and cross-tenant isolation), running against a real in-memory MongoDB with genuinely inserted `Item` documents — not mocks. INV-SRCH-007 in particular is a regression test for the `$or` bug: it asserts that "search=shirt + shelf=A-03" still excludes non-shirt items on that shelf, which would have failed before the fix. INV-SRCH-009/013 ("same shirt on multiple shelves") is modeled as two separate `Item` documents sharing brand/size/color but different shelves/SKUs, since that's how this data model actually represents that case today (see the limitation below).

`frontend/src/pages/Inventory/InventoryVariantSearch.test.tsx` covers five cases with React Testing Library and a mocked API: real data loads and renders, an API failure shows the error state with no fabricated rows, a genuinely empty result shows the correct empty state, the search form sends the right filter params, and Clear Filters resets and re-fetches.

As with the Settings fix, I could not run these myself — no shell access on your machine in this session. Please run, in `backend/`: `npm run build && npm test -- inventoryVariantSearch.test.js` (then `npm test` for the full suite), and in `frontend/`: `npm test -- InventoryVariantSearch.test.tsx`. Send me the output and I'll fix anything that breaks.

## 5. A real data-model limitation worth knowing about

Your recommended schema splits `products` and `product_variants` into separate tables. This codebase's existing `Item` model already plays the role your spec's `product_variants` table would — each Item has its own SKU, brand, size, color, and (a single) shelf — so I did not introduce a separate variant table, since doing so would mean touching every place that already reads `Item` (POS, GRN, purchase orders, stock reservation, reports — all with existing passing tests), for what would functionally be a rename.

One real gap this leaves: the schema has a `warehouseLevels` array meant to let one Item track stock across multiple shelves, but nothing in the codebase — not GRN, not purchase orders, not anywhere — ever reads or writes it; it's unused. So today, "the same shirt on two shelves" can only be represented as two separate Item documents (same brand/size/color, different shelf and SKU) — which is what INV-SRCH-009/013 test against, and it's a legitimate way to model it, but it means each shelf's stock is tracked as an independent SKU rather than one product split across locations. If you want true single-SKU multi-shelf tracking, that's a bigger follow-up: someone needs to decide how GRN/purchase-order receiving should populate `warehouseLevels`, and the search endpoint would need to expand one Item into multiple result rows (one per shelf) instead of one row per document.

## 6. Remaining limitations

- Test results not yet run by me — see §4 for exact commands.
- The Brand/Size/Color/Shelf catalog is currently empty until you run `npm run seed:inventory-filters`; until then, the filter dropdowns will only show values already present on your own Items (still real data, just narrower).
- Multi-shelf-per-SKU tracking is aspirational schema only, not a working feature — see §5.
- `ProductModal.tsx` (the Add/Edit Item form) still accepts brand/size/color/shelf as free-text fields rather than dropdowns sourced from the new catalog collections. Wiring that up would make new items consistent with the catalog by construction, but was outside "search and filter" scope — flagging as a natural follow-up.

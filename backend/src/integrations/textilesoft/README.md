# Textilesoft (SQL Server "SSS") -> ERP item & stock adapter

One-way, read-only sync of products and stock from the shop server's Textilesoft database into the
ERP's MongoDB `Item` collection. Nothing is ever written to the shop database.

## Setup

1. `npm install` in `backend/` (adds `mssql`).
2. On the SQL Server, create a dedicated login with **only** `db_datareader` on `SSS`
   (do not reuse the login from Textilesoft's `web.config`). Make sure TCP/IP is enabled and the
   ERP machine can reach the server (prefer a fixed port over the `SQLEXPRESS` named instance).
3. Set the `TEXTILESOFT_DB_*` variables in `backend/.env` (see `.env.example`).

## Use

```
npm run discover:textilesoft                      # lists tables/columns, writes textilesoft-discovery/
npm run discover:textilesoft -- --sample dbo.X    # 5 rows of a table, to verify columns
# copy textilesoft-discovery/textilesoft.mapping.suggested.json -> textilesoft.mapping.json and edit
npm run sync:textilesoft -- --tenant <tenantId> --dry-run
npm run sync:textilesoft -- --tenant <tenantId>
```

Stock policy (`--stock`): `initial-only` (default) sets stock only on newly created items;
`overwrite` makes the shop DB the source of truth for `stockQty` on every run (logged as `ADJUST`
in StockLog) -- use it only while billing still happens in Textilesoft; `off` never touches stock.

Items are matched by barcode, then SKU, then name. Existing item names are never rewritten; new
items whose name collides (size/colour variants) get `" - <sku>"` appended, because the ERP
enforces unique names per tenant.

## Live SQL mode (`ITEM_DATA_SOURCE=sql`)

Besides the one-way sync above, the API can serve **item and stock reads** straight from the shop
database. Set in `backend/.env` and restart the API:

```
ITEM_DATA_SOURCE=sql            # or mongo (default)
TEXTILESOFT_MAPPING_FILE=textilesoft.mapping.json   # reviewed mapping (same format as the sync)
TEXTILESOFT_LOW_STOCK_DEFAULT=5 # reorder level when the shop DB has none
```

What switches: `GET /inventory` (list/search/filters/pagination), `/inventory/:id`,
`/inventory/barcode/:barcode`, `/inventory/low-stock`, `/inventory/inventory-stats`.
Customers, suppliers, invoices and every other module keep using MongoDB, and nothing is ever
written to the shop DB.

How ERP writes work in SQL mode: each item read from SQL is mirrored as a MongoDB Item (created
on first read), so sales/purchases/adjustments keep using stable ids and the existing stock checks.
On every read, catalogue fields and prices are refreshed from SQL and

    stock = shop stock (SQL) + ERP movements (StockLog deltas written by the ERP)

so a sale made in the ERP lowers the shown stock, and stock changes made in Textilesoft still show
up. If the shop DB is unreachable the API logs a warning and serves the last mirrored MongoDB data.

Limits: `inventory-stats` and the low-stock filter are computed from shop stock only (they don't
include ERP-side movements); rows the mapping can't turn into a valid item are skipped with a warning.
Run `npm run selftest:sql-mode` for an offline check of the query building and overlay maths.

### Full mirror (so every screen shows data in SQL mode)

Reports, stock aging, filters and other screens read MongoDB directly. So in SQL mode the API also
copies the whole catalogue into MongoDB in the background: it starts on the first inventory request
after an API restart, then repeats every `TEXTILESOFT_MIRROR_INTERVAL_MIN` minutes (default 60,
0 = once per start). The item list, barcode lookup, low-stock and stats are answered from SQL
immediately; the other screens fill in as soon as the first mirror finishes (~10-30 s). To run it
now: `npm run mirror:textilesoft -- --tenant <tenantId>`. Sold-out lots are mirrored too (stock 0).

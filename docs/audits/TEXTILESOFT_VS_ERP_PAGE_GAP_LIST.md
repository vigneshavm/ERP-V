# Textilesoft 17.07.2025 vs ERP — page gap list

Generated 2026-10-01. Full page-by-page list: `TEXTILESOFT_VS_ERP_PAGE_GAP_LIST.xlsx` (sheets: Summary by area, All 652 pages, Missing pages, ERP-only pages).

**How it was made.** Textilesoft has **652 `.aspx` pages**. Each page name was mapped to a functional area and to the ERP screen that does the job today (ERP routes, report registry, master-data types, backend SQL adapters). The mapping is by page name and ERP code, **not by opening every page**, so treat "Partial" as "an ERP screen exists for the job but not the full legacy behaviour". Page usage was not measured (see "Next check").

## 1. Result

| Status | Pages | Meaning |
|---|---|---|
| Covered | 189 | ERP does the job (many legacy variants collapse into one ERP screen, e.g. 90 purchase-entry variants → GRN / Bills / Express) |
| Partial | 365 | An ERP screen exists, but behaviour, SQL write, or reporting dimensions are missing |
| Missing | 81 | No ERP page at all |
| Not business (test, templates, login helpers) | 17 | Ignore |

## 2. Missing outright (81 pages)

| Area | Pages | What it is |
|---|---|---|
| Gift counter | 18 | Gift billing, gift purchase / return / suppliers, gift sales and purchase reports, gift token bills |
| Reports | 20 | Tender-mode-wise sales (Daily/Mode/Grocery mode), user (login)-wise sales, purchase-vs-sales comparison (4 variants), pattern-and-size sales, rate-wise sales, section-wise sales, category-customer payment, customer city-wise, GRN-wise sales |
| Salesman / commission reports | 11 | Salesman-wise, incharge-wise, range-wise, days-from, age-wise product commission, special salesman commission, PCS-wise |
| Stock reports | 10 | Floor-wise stock (detail, summary, minimum qty, section commission), pattern/size, pattern/brand/size, supplier pattern/size, model-no, appliance model |
| Discounts and schemes | 7 | Free-qty / free-product entry, discount-offer entry, barcode-wise / product-wise / date-wise discount (+ report) |
| Sales bill edit | 6 | Edit a posted bill. **Deliberately not built** (correct through exchange / return); decide if the shop still needs it |
| Need-product requests | 4 | Record items customers asked for that aren't stocked (entry, edit, approval, report) |
| Picture masters | 2 | Group / sub-group pictures |
| System | 2 | Account-date lock per user, share menu |
| GST | 1 | Category-wise GST report |

## 3. Biggest "Partial" areas (the real work)

| Area (pages) | What exists in the ERP | What is missing |
|---|---|---|
| Sales billing (27) and wholesale / credit / department billing (24) | POS writes the standard GST bill to SQL (discounts, tenders, exchange, limits); Wholesale screen | Product-discount box and salesman per line on the till, held bills in SQL, Tamil / touch / token / grocery / tea / electrical / department variants, credit bill entry in SQL |
| Bill views and reprint (23) | Sales > Invoices (SQL read), POS reprint | Pending and cancelled bill views, cancel bill, duplicate bill with barcode, category-wise bill view |
| Barcode label printing (29 printer drivers + 23 stickers/settings + 7 generation) | One generic label modal and reprint queue | Per-printer formats (TSC, TVS, Godex, Zebra, Citizen), counter-wise barcode settings, stand-alone barcode taking, sticker types (customer, supplier, salesman, pattern-size) |
| Product master, MRP and barcode rate change (22 + 14) | Product master, batch price update, rate revisions | Barcode-wise, same-barcode, combo, fancy, invoice, metre rate-change screens; category-wise MRP; purchase / sales percentage masters |
| System, sales and purchase settings (22) and users / rights (10) | Settings tabs, MIS controls, discount permissions | Per-screen rights matrix, cash / sales focus-order settings, EMI master, swipe-machine master, account-date lock, super reset |
| Customers (15), loyalty points (9), credit collection (10) | Customers, groups, ledger, loyalty (Mongo) | Not tied to the SQL bill: customer on bill, points earned / redeemed, balance cash collection in SQL (deferred) |
| Cash in/out, petty cash, bank / paid reports (14 + 12 + 11) | Cash & bank, petty cash close, expenses | Login-wise open / close petty cash, cash in/out by bill / cashier / item, counter-wise paid reports |
| Combo offers (16) | Combo offer manager | Barcode-wise, invoice-wise, single / multi MRP combo entry, combo stock and transfer |
| Invoice-style purchase with MRP pending (17) | Purchase bills, MRP-pending list (Mongo) | SQL write for MRP-pending flow, invoice price offers |
| Stock damage / missing (6), material transfer (4), minimum qty (4), sales orders (4) | Stock write-off, stock transfer, low stock, sales orders | All still Mongo, not written to SQL; minimum-qty masters by brand / floor / supplier; order-delivery bill |
| Reports (22 partial) | Reports hub with ~35 reports | Many Textilesoft dimensions (see section 2) |

## 4. Suggested order

1. **Counter-critical (this week's billing work):** product-discount box and salesman on the till, held bills, cancel bill with pending / cancelled bill views, closing-sales / tender-mode / user-wise reports.
2. **Money and stock correctness in SQL:** customers and points on the SQL bill, balance cash collection, stock damage / missing / material transfer written to SQL.
3. **Daily reports the shop uses:** tender-mode, user-wise, salesman and commission reports, pattern/size and floor stock reports, purchase-vs-sales.
4. **Barcode printing:** the printer model(s) the shop actually uses, not all 29.
5. **Decide, don't build yet:** gift counter, need-product requests, picture masters, bill edit, account-date lock.

## 5. ERP has, Textilesoft doesn't
Estimates, delivery challans, credit / debit notes, payroll / attendance / labour, budget / goals / journal / bank statement / SMS tracker, recurring expenses, cheques vault and ageing, rate revisions, aged stock and batch price update, online store and marketing, audit log, device intelligence and SQL restore manager, tenants, POS failed-bill queue.

## 6. Next check (needed before building)
Which legacy pages the shop actually uses. Row counts in the matching tables (gift sales, need-product, cash in/out, material transfer, stock missing, free-qty, offers) show it quickly; a page with an empty table can move to "Skip". A query for this can be added to the schema-discovery script.

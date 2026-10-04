import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const legacyCoverage = [
  {
    "id": "M05",
    "name": "New Agent",
    "routes": [
      "/finance/agents",
      "/suppliers/agents"
    ],
    "status": "Implemented; native writer permission required",
    "reason": "Native agent registration is available on the respective screen; supplier linkage and purchase commission remain reduced. The screen checks the actual configured writer and disables saving without existing native-table permissions."
  },
  {
    "id": "M07",
    "name": "Mobile No Change",
    "routes": [
      "/customers"
    ],
    "status": "Implemented; native writer permission required",
    "reason": "Native mobile change and matching sales2.mbl_no updates are available on the respective screen, with duplicate and identity guards. The screen checks the actual configured writer and disables saving without existing native-table permissions."
  },
  {
    "id": "M08",
    "name": "Card No Change",
    "routes": [
      "/customers"
    ],
    "status": "Implemented; native writer permission required",
    "reason": "Native card change and matching sales2.cus_card updates preserve serial, points and balances; ambiguous identities are refused. The screen checks the actual configured writer and disables saving without existing native-table permissions."
  },
  {
    "id": "M09",
    "name": "Customer Name Change",
    "routes": [
      "/customers"
    ],
    "status": "Implemented; native writer permission required",
    "reason": "Native name change also updates matching historical sales2.cus_name, as the compiled legacy handler does. The screen checks the actual configured writer and disables saving without existing native-table permissions."
  },
  {
    "id": "M10",
    "name": "New Different Customer Name Entry",
    "routes": [
      "/customers"
    ],
    "status": "Implemented; native writer permission required",
    "reason": "Native Different Customer Entry uses newcustomer.religion and contact fields, without awarding points. The screen checks the actual configured writer and disables saving without existing native-table permissions."
  },
  {
    "id": "M11",
    "name": "New Expense Group",
    "routes": [
      "/expenses/categories",
      "/settings/master-data"
    ],
    "status": "Implemented; acceptance pending",
    "reason": "Native expense groups and linked names use existing SQL masters. Budgets, approval policies and deactivation are unavailable."
  },
  {
    "id": "M12",
    "name": "New Expense Name",
    "routes": [
      "/expenses/categories",
      "/settings/master-data"
    ],
    "status": "Implemented; acceptance pending",
    "reason": "Native expense groups and linked names use existing SQL masters. Budgets, approval policies and deactivation are unavailable."
  },
  {
    "id": "P07",
    "name": "Super Purchase → New Stock Entry",
    "routes": ["/purchase/textilesoft/new-stock-entry"],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Super Purchase differences are unknown; ordinary purchase is not an accepted equivalent."
  },
  {
    "id": "P08",
    "name": "Super Purchase → New Stock Add Entry",
    "routes": ["/purchase/textilesoft/new-stock-add-entry"],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Super-purchase add identity/posting contract must be reviewed."
  },
  {
    "id": "P09",
    "name": "Super Purchase → New Stock Update",
    "routes": ["/purchase/textilesoft/new-stock-update"],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Super-purchase edit/stock-difference contract must be reviewed."
  },
  {
    "id": "P12",
    "name": "Purchase Split Entry",
    "routes": ["/purchase/textilesoft/purchase-split-entry"],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Legacy code review (17.07.2025 copy): Purchase Split Entry splits an existing purchase line into new barcoded lines through a staging table, and refuses to split beyond the original MTR or qty. The final posting step into purchase details was not isolated and no compatible existing SQL storage has been verified, so the operation stays unavailable. Garment packs/lot trace are only related coverage."
  },
  {
    "id": "B07",
    "name": "RC GRN Details",
    "routes": [
      "/inventory/barcodes",
      "/inventory/reprint"
    ],
    "status": "Implemented; acceptance pending",
    "reason": "RC GRN lookup joins ratecha.RCGRN to purentrydetails by barcode."
  },
  {
    "id": "B08",
    "name": "Reference GRN Details",
    "routes": [
      "/inventory/barcodes",
      "/inventory/reprint"
    ],
    "status": "Implemented; acceptance pending",
    "reason": "Reference GRN lookup joins clientpurentrydetails.CLREFGRN to purentrydetails by barcode."
  },
  {
    "id": "B14",
    "name": "Barcode Cancel",
    "routes": [
      "/inventory"
    ],
    "status": "Implemented; acceptance pending",
    "reason": "Cancel flags the barcode's purchase line (purentrydetails.STATUS = '1') and billing then refuses to scan it, matching the legacy 17.07.2025 behavior seen in the shop data (3 cancelled lines in one GRN, header quantity/net totals and stockdetails rows unchanged). Not reproduced: the legacy procedure also rewrote the GRN header GST split from the cancelled lines only, because its intent is unverified. Any saved sale refuses the cancel. The _IGST and _WB procedure variants have not been reviewed."
  },
  {
    "id": "B15",
    "name": "Cancel used barcode",
    "routes": [
      "/inventory/barcodes"
    ],
    "status": "Implemented; acceptance pending",
    "reason": "Any saved salsntry barcode rejects cancellation with 409. Unsold barcodes can now be cancelled as described for B14; already-cancelled barcodes are refused with 409. Purchase-return and other references are not checked beyond the legacy sale rule."
  },
  {
    "id": "B16",
    "name": "Salesman Sticker Print",
    "routes": [
      "/inventory/reprint"
    ],
    "status": "Implemented; acceptance pending",
    "reason": "Native employee code/name generates configurable TSC or Zebra sticker files; physical print and scan acceptance remain pending."
  },
  {
    "id": "S16",
    "name": "PO/BAL",
    "routes": [
      "/pos"
    ],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "PO/BAL meaning is not established; do not assume points alone."
  },
  {
    "id": "S19",
    "name": "Lookup summary",
    "routes": [
      "/pos"
    ],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Lookup-summary purpose/refresh timing requires a specific screen contract."
  },
  {
    "id": "S20",
    "name": "Other billing fields",
    "routes": [
      "/pos"
    ],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "PF, PRATE, CMAmt and flags require field-level definitions."
  },
  {
    "id": "REP02",
    "name": "Mode Wise Sales",
    "routes": [
      "/reports"
    ],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Legacy code review (17.07.2025 copy): sales2.mode holds the bill number (bill-series prefix plus serial), so Mode Wise means grouped by bill series, not payment type or channel. The ERP report already groups by sales2.mode; the legacy Summary/Detail type and counter, company, item, salesman and login filters are not yet matched, and the legacy report output has not been compared."
  },
  {
    "id": "REP08",
    "name": "Missing Sales",
    "routes": [
      "/reports",
      "/reports/insights",
      "/reports/missing-sales"
    ],
    "status": "Implemented; acceptance pending",
    "reason": "Native Escsave report distinguishes ESC and Delete lines. It does not infer missing bill numbers."
  },
  {
    "id": "REP14",
    "name": "New DateWise Stock",
    "routes": [
      "/reports",
      "/inventory/aged-stock"
    ],
    "status": "Reduced scope; acceptance pending",
    "reason": "Legacy contract (procedures datestockDETAIL/daterangestockDETAIL, 17.07.2025 review): the date window filters the PURCHASE entry date only (active lines), not a historical closing date. Each purchased barcode is netted against all sales to date (salsntry and superbill1), purchase returns, stock-take, and material transfers, giving remaining quantity, value at purchase and net rate, and age in days. The ERP's stock-age report (/inventory/aged-stock) already filters by purchase date and shows purchased, sold, returned and remaining quantity with age; its stock now also nets Super Bill sales (919 units on stock barcodes in the SSS_copy review). In SSS_copy the stock-take, transfer, salsntry1 and purretrun tables are empty, so nothing else is missing today. Still reduced: no company filter and no value columns at purchase/net rate, and the output has not been compared with the legacy report."
  },
  {
    "id": "REP15",
    "name": "PatternWise Supplier SizeWise Stock",
    "routes": [
      "/reports"
    ],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Legacy has two separate supplier/pattern/size stock pages. The ERP report now shows the supplier (read from the existing purgrnentry header by GRN number, latest header row) and supports a supplier filter, sorted pattern, supplier, size. It still lists stored stock fields without legacy color/size-band filters, and the legacy output has not been compared."
  },
  {
    "id": "REP16",
    "name": "Pattern Supplier SizeWise Stock Report",
    "routes": [
      "/reports"
    ],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Legacy has a separate page, Supplier Pattern AND Size AND ColorWise stock, but which legacy page maps to REP15 versus REP16 is not confirmed. The ERP report now shows the supplier and supports a supplier filter, sorted supplier, pattern, size (the order follows the menu name and is unverified). Color grouping and legacy output comparison are still pending."
  },
  {
    "id": "BK05",
    "name": "Preserve newer transactions",
    "routes": [
      "/settings/restore",
      "/settings/sync"
    ],
    "status": "Implemented in ERP; no legacy equivalent; acceptance pending",
    "reason": "The legacy deployment contains no backup or restore code, so there is no legacy behavior to match. The ERP's owner-only SQL restore restores into a side copy, then carries over local bills that are at or after the backup's last bill time or written by the ERP, matched on sysidandbill so each bill is carried exactly once, saves them to a JSON file first, verifies, and only then swaps the databases. It has not been accepted against a real backup, and it has no automated test."
  },
  {
    "id": "BK06",
    "name": "Timestamp ties",
    "routes": [
      "/settings/restore",
      "/settings/sync"
    ],
    "status": "Implemented in ERP; no legacy equivalent; acceptance pending",
    "reason": "Ties are resolved by the bill key (sysidandbill), not by timestamp. A same-key bill with a different time is reported as a conflict and saved, never overwritten. The selection now uses at-or-after the backup's last bill time instead of strictly after, so a local bill that ties the backup's last timestamp is no longer skipped. This change is untested against SQL Server."
  }
];

export default function LegacyCoverageNotice() {
  const { pathname } = useLocation();
  const affected = legacyCoverage.filter(item => item.routes.some(route => pathname === route || pathname.startsWith(route + '/')));
  if (!affected.length) return null;
  return <aside aria-label="Legacy operation availability" className="m-4 rounded-md border border-warning/40 bg-surface p-4 text-main">
    <details open><summary className="cursor-pointer font-semibold">Legacy operation availability: {affected.map(item => item.id).join(', ')}</summary>
      <ul className="mt-3 space-y-2">{affected.map(item => <li key={item.id}><strong>{item.name}: </strong>{item.reason}</li>)}</ul>
      <Link className="mt-3 inline-block underline" to="/settings/legacy-coverage">Review all 26 legacy operations</Link>
    </details>
  </aside>;
}

export function LegacyCoverageReview() {
  return <main className="p-6 space-y-4 text-main">
    <h1 className="text-2xl font-bold">TEXTILESOFT legacy coverage</h1>
    <p>All 26 operations have explicit scope. Implementation checks do not establish legacy acceptance. Unverified behavior remains unavailable.</p>
    <table className="w-full text-left"><thead><tr><th>Case</th><th>Operation</th><th>Scope</th><th>Availability</th></tr></thead>
      <tbody>{legacyCoverage.map(item => <tr key={item.id}><td className="p-2 align-top">{item.id}</td><td className="p-2 align-top">{item.name}</td><td className="p-2 align-top">{item.status}</td><td className="p-2">{item.reason}</td></tr>)}</tbody>
    </table>
  </main>;
}


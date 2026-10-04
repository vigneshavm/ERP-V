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
    "reason": "Purchase Split Entry semantics are unknown; garment packs/lot trace are only related coverage."
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
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Barcode cancellation versus deactivation/write-off requires a dedicated legacy rule."
  },
  {
    "id": "B15",
    "name": "Cancel used barcode",
    "routes": [
      "/inventory/barcodes"
    ],
    "status": "Native operation implemented; remaining scope reduced",
    "reason": "Any saved salsntry barcode rejects cancellation with 409. Unsold cancellation remains unavailable pending verified reversal procedures."
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
    "reason": "Mode meaning is unverified; do not equate it automatically with channel or payment."
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
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Historical closing stock and purchase-date filtering are different report contracts."
  },
  {
    "id": "REP15",
    "name": "PatternWise Supplier SizeWise Stock",
    "routes": [
      "/reports"
    ],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Grouping and joins need specific legacy report comparison."
  },
  {
    "id": "REP16",
    "name": "Pattern Supplier SizeWise Stock Report",
    "routes": [
      "/reports"
    ],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Distinct behavior from REP15 must be established before replacement."
  },
  {
    "id": "BK05",
    "name": "Preserve newer transactions",
    "routes": [
      "/settings/restore",
      "/settings/sync"
    ],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Exactly-once preservation across restore has no accepted existing SQL storage/checkpoint contract; restore is prohibited under the current rules."
  },
  {
    "id": "BK06",
    "name": "Timestamp ties",
    "routes": [
      "/settings/restore",
      "/settings/sync"
    ],
    "status": "Reduced scope; legacy parity unavailable",
    "reason": "Timestamp ties require stable existing identifiers/checkpoints; no hidden ID crosswalk may be introduced."
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


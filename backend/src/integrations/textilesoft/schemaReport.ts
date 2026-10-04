/**
 * Pure helpers for the schema-discovery report (no database access here, so they are easy to test).
 * Input is a SchemaSnapshot read from a restored copy of the Textilesoft database; output is the
 * Markdown the team reviews before deciding which ERP data lives in `dbo` and which needs `erp.*`.
 */

export interface DbTable {
  schema: string;
  table: string;
  rows: number;
  hasIdentity: boolean;
  hasPk: boolean;
  createDate?: string;
  modifyDate?: string;
}
export interface DbColumn {
  schema: string;
  table: string;
  name: string;
  type: string;
  maxLength: number;
  precision: number;
  scale: number;
  nullable: boolean;
  identity: boolean;
  computed: boolean;
  default: string | null;
}
export interface DbIndex {
  schema: string;
  table: string;
  name: string;
  typeDesc: string;
  unique: boolean;
  primaryKey: boolean;
  keyColumns: string;
}
export interface DbForeignKey {
  name: string;
  parentSchema: string;
  parentTable: string;
  refSchema: string;
  refTable: string;
  columns: string;
}
export interface DbObject {
  schema: string;
  name: string;
  typeDesc: string;
  parent: string | null;
  definitionLength: number | null;
}
export interface SchemaSnapshot {
  generatedAt: string;
  database: string;
  version: string;
  collation: string;
  compatibilityLevel: number;
  recoveryModel: string;
  backupFile?: string;
  schemas: string[];
  tables: DbTable[];
  columns: DbColumn[];
  indexes: DbIndex[];
  foreignKeys: DbForeignKey[];
  objects: DbObject[];
}

const key = (s: string, t: string) => `${s}.${t}`;

export function fmtType(c: DbColumn): string {
  const t = c.type.toLowerCase();
  if (["varchar", "char", "varbinary", "binary"].includes(t))
    return `${t}(${c.maxLength === -1 ? "max" : c.maxLength})`;
  if (["nvarchar", "nchar"].includes(t))
    return `${t}(${c.maxLength === -1 ? "max" : c.maxLength / 2})`;
  if (["decimal", "numeric"].includes(t)) return `${t}(${c.precision},${c.scale})`;
  return t;
}

const cell = (v: string) => v.replace(/\|/g, "\\|");

export function renderSchemaMd(s: SchemaSnapshot): string {
  const colsBy = new Map<string, DbColumn[]>();
  for (const c of s.columns) {
    const k = key(c.schema, c.table);
    (colsBy.get(k) ?? colsBy.set(k, []).get(k)!).push(c);
  }
  const idxBy = new Map<string, DbIndex[]>();
  for (const i of s.indexes) {
    const k = key(i.schema, i.table);
    (idxBy.get(k) ?? idxBy.set(k, []).get(k)!).push(i);
  }
  const fkBy = new Map<string, DbForeignKey[]>();
  for (const f of s.foreignKeys) {
    const k = key(f.parentSchema, f.parentTable);
    (fkBy.get(k) ?? fkBy.set(k, []).get(k)!).push(f);
  }
  const sorted = [...s.tables].sort((a, b) =>
    key(a.schema, a.table).localeCompare(key(b.schema, b.table)),
  );
  const filled = sorted.filter((t) => t.rows > 0);
  const empty = sorted.filter((t) => t.rows === 0);
  const noPk = sorted.filter((t) => !t.hasPk);

  const out: string[] = [];
  out.push(`# Schema: ${s.database}`);
  out.push("");
  out.push(`Generated ${s.generatedAt}${s.backupFile ? ` from \`${s.backupFile}\`` : ""}.`);
  out.push("");
  out.push(`- Server: ${s.version.split("\n")[0]}`);
  out.push(`- Collation: ${s.collation} - compatibility level ${s.compatibilityLevel} - recovery ${s.recoveryModel}`);
  out.push(`- Schemas: ${s.schemas.join(", ") || "(none)"}`);
  out.push(`- Tables: ${s.tables.length} (${filled.length} with rows, ${empty.length} empty, ${noPk.length} without a primary key)`);
  out.push(`- Columns: ${s.columns.length} - indexes: ${s.indexes.length} - foreign keys: ${s.foreignKeys.length}`);
  const byType = new Map<string, number>();
  for (const o of s.objects) byType.set(o.typeDesc, (byType.get(o.typeDesc) ?? 0) + 1);
  out.push(`- Programmable objects: ${[...byType].map(([t, n]) => `${n} ${t}`).join(", ") || "none"}`);
  out.push("");
  out.push(`> Row counts come from catalog statistics (sys.partitions) and are approximate. No row data is included.`);
  out.push("");
  out.push("## Tables with rows");
  out.push("");
  for (const t of filled) {
    const k = key(t.schema, t.table);
    const cols = colsBy.get(k) ?? [];
    const pk = (idxBy.get(k) ?? []).find((i) => i.primaryKey);
    out.push(`### ${k} - ${t.rows.toLocaleString("en-US")} rows`);
    out.push("");
    out.push(pk ? `Primary key: \`${pk.keyColumns}\`` : "**No primary key**");
    if (t.hasIdentity) out.push("Has an identity column.");
    out.push("");
    out.push("| Column | Type | Null | Notes |");
    out.push("|---|---|---|---|");
    for (const c of cols) {
      const notes = [c.identity ? "identity" : "", c.computed ? "computed" : "", c.default ? `default ${c.default}` : ""]
        .filter(Boolean)
        .join(", ");
      out.push(`| ${cell(c.name)} | ${cell(fmtType(c))} | ${c.nullable ? "yes" : "no"} | ${cell(notes)} |`);
    }
    const fks = fkBy.get(k) ?? [];
    if (fks.length) {
      out.push("");
      out.push("Foreign keys: " + fks.map((f) => `\`${f.columns}\` -> ${f.refSchema}.${f.refTable}`).join("; "));
    }
    const others = (idxBy.get(k) ?? []).filter((i) => !i.primaryKey);
    if (others.length) {
      out.push("");
      out.push("Indexes: " + others.map((i) => `${i.unique ? "unique " : ""}${i.name} (${i.keyColumns})`).join("; "));
    }
    out.push("");
  }
  out.push("## Empty tables");
  out.push("");
  out.push(empty.map((t) => `${key(t.schema, t.table)} (${(colsBy.get(key(t.schema, t.table)) ?? []).length} cols)`).join(", ") || "none");
  out.push("");
  out.push("## Tables without a primary key");
  out.push("");
  out.push(noPk.map((t) => key(t.schema, t.table)).join(", ") || "none");
  out.push("");
  out.push("## Views, procedures, functions, triggers");
  out.push("");
  if (!s.objects.length) out.push("none");
  else {
    out.push("| Type | Name | Parent table | Definition chars |");
    out.push("|---|---|---|---|");
    for (const o of [...s.objects].sort((a, b) => a.typeDesc.localeCompare(b.typeDesc) || a.name.localeCompare(b.name)))
      out.push(`| ${o.typeDesc} | ${o.schema}.${o.name} | ${o.parent ?? ""} | ${o.definitionLength ?? "encrypted/unknown"} |`);
  }
  out.push("");
  return out.join("\n");
}

// ---- Concept probe: which ERP concepts already have a Textilesoft table? ----------------------

export interface Concept {
  key: string;
  label: string;
  /** ERP models this concept would replace (from the SQL-only strategy, section 5.2/5.3). */
  erpModels: string;
  /** Proposed fallback if nothing is found in dbo. */
  fallback: string;
  patterns: RegExp[];
}

export const CONCEPTS: Concept[] = [
  { key: "customer", label: "Customers / parties", erpModels: "Customer", fallback: "erp.customer", patterns: [/cust/i, /^party/i, /partymaster/i, /^member/i, /^client/i] },
  { key: "loyalty", label: "Loyalty / points", erpModels: "LoyaltyTransaction, LoyaltyRule", fallback: "erp.loyalty_txn, erp.loyalty_rule", patterns: [/loyal/i, /point/i, /reward/i] },
  { key: "supplier", label: "Suppliers / agents", erpModels: "Supplier, SupplierGroup, Agent", fallback: "erp.supplier_group, erp.agent", patterns: [/suppl/i, /vendor/i, /agent/i, /broker/i] },
  { key: "payment", label: "Payments / receipts / vouchers", erpModels: "PaymentIn, PaymentOut, PurchasePayment", fallback: "erp.payment", patterns: [/receipt/i, /payment/i, /voucher/i, /^pay/i, /collect/i] },
  { key: "due", label: "Dues / outstanding / ledger", erpModels: "Due, DueAdjustment, SupplierReconciliation", fallback: "erp.due, erp.due_adjustment", patterns: [/\bdue/i, /outstand/i, /ledger/i, /balance/i, /account/i] },
  { key: "bank", label: "Banks / cheques / cash book", erpModels: "BankAccount, Cheque, CashbankTransaction, BankStatementTransaction", fallback: "erp.bank_account, erp.cheque, erp.cashbank_txn", patterns: [/bank/i, /cheq/i, /chq/i, /cashbook/i, /cash_?book/i, /^cash/i] },
  { key: "expense", label: "Expenses", erpModels: "Expense, ExpenseCategory, RecurringExpense", fallback: "erp.expense, erp.expense_category", patterns: [/expens/i, /^exp_/i, /^exp[a-z]*head/i] },
  { key: "hr", label: "Employees / attendance / payroll", erpModels: "Employee, DailyAttendance, PayrollRun, Payslip, SalaryAdvance", fallback: "erp.employee, erp.attendance_daily, erp.payroll_run ...", patterns: [/employ/i, /staff/i, /attend/i, /salary/i, /payroll/i, /wages?/i, /worker/i] },
  { key: "estimate", label: "Estimates / quotations / challans / orders", erpModels: "Estimate, DeliveryChallan, SalesOrder", fallback: "erp.estimate, erp.delivery_challan, erp.sales_order", patterns: [/estimat/i, /quot/i, /challan/i, /proforma/i, /salesorder/i, /^order/i] },
  { key: "debitnote", label: "Debit / credit notes", erpModels: "DebitNote", fallback: "erp.debit_note", patterns: [/debit/i, /credit/i, /\bnote\b/i] },
  { key: "stocktransfer", label: "Stock transfer / shelf / rack", erpModels: "StockTransfer, Shelf, GRNTransfer", fallback: "erp.stock_transfer, erp.shelf", patterns: [/transfer/i, /shelf/i, /rack/i, /godown/i] },
  { key: "ratechange", label: "Rate revision / price change", erpModels: "RateRevision", fallback: "erp.rate_revision", patterns: [/ratechange/i, /revis/i, /pricechange/i, /rate_?change/i, /mrpchange/i] },
  { key: "gst", label: "GST / HSN / tax", erpModels: "TaxMaster, GSTReconciliation", fallback: "erp.gst_reconciliation", patterns: [/gst/i, /hsn/i, /^tax/i] },
  { key: "daybook", label: "Day end / petty cash / closing", erpModels: "DayEndReconciliation, PettyCashClose, DailyFinance", fallback: "erp.day_end, erp.petty_cash_close", patterns: [/dayend/i, /day_?end/i, /petty/i, /closing/i, /daybook/i] },
  { key: "loan", label: "Loans / EMI", erpModels: "Loan, LoanPayment, EMIPlan", fallback: "erp.loan, erp.loan_payment, erp.emi_plan", patterns: [/loan/i, /\bemi/i, /interest/i] },
  { key: "sms", label: "SMS / WhatsApp / notifications", erpModels: "No active SQL-only runtime model", fallback: "No verified ERP-owned campaign data", patterns: [/\bsms/i, /whats/i, /notif/i, /message/i] },
  { key: "user", label: "Users / rights / roles", erpModels: "User, Role", fallback: "erp.role_permission, erp.user_profile", patterns: [/newuser/i, /^user/i, /right/i, /^role/i, /login/i] },
  { key: "audit", label: "Audit / history / logs", erpModels: "AuditLog", fallback: "erp.audit_log", patterns: [/audit/i, /history/i, /^log/i, /_log$/i, /trail/i] },
  { key: "settings", label: "Settings / config", erpModels: "ShopSettings, SystemConfig", fallback: "erp.shop_settings, erp.system_config", patterns: [/setting/i, /config/i, /^common/i, /param/i] },
  { key: "commission", label: "Commission / offers / combos", erpModels: "CommissionRule", fallback: "erp.commission_rule; no verified offer table", patterns: [/commis/i, /offer/i, /combo/i, /discount/i, /scheme/i] },
  { key: "serial", label: "Serials / reprint / barcode queue", erpModels: "SerializedUnit, ReprintQueue", fallback: "erp.serialized_unit, erp.reprint_queue", patterns: [/serial/i, /reprint/i, /barcode/i, /label/i] },
];

export interface ConceptHit {
  concept: Concept;
  tables: { name: string; rows: number; columns: number }[];
  columnOnly: { table: string; column: string }[];
  verdict: "candidate-in-dbo" | "only-empty-tables" | "column-hints-only" | "not-found";
}

export function probeConcepts(s: SchemaSnapshot, concepts: Concept[] = CONCEPTS): ConceptHit[] {
  const colCount = new Map<string, number>();
  for (const c of s.columns) colCount.set(key(c.schema, c.table), (colCount.get(key(c.schema, c.table)) ?? 0) + 1);
  return concepts.map((concept) => {
    const tables = s.tables
      .filter((t) => concept.patterns.some((p) => p.test(t.table)))
      .map((t) => ({ name: key(t.schema, t.table), rows: t.rows, columns: colCount.get(key(t.schema, t.table)) ?? 0 }))
      .sort((a, b) => b.rows - a.rows);
    const tableNames = new Set(tables.map((t) => t.name));
    const columnOnly: { table: string; column: string }[] = [];
    for (const c of s.columns) {
      if (tableNames.has(key(c.schema, c.table))) continue;
      if (concept.patterns.some((p) => p.test(c.name))) columnOnly.push({ table: key(c.schema, c.table), column: c.name });
    }
    const verdict: ConceptHit["verdict"] = tables.some((t) => t.rows > 0)
      ? "candidate-in-dbo"
      : tables.length
        ? "only-empty-tables"
        : columnOnly.length
          ? "column-hints-only"
          : "not-found";
    return { concept, tables, columnOnly: columnOnly.slice(0, 12), verdict };
  });
}

const VERDICT_TEXT: Record<ConceptHit["verdict"], string> = {
  "candidate-in-dbo": "Candidate table(s) in dbo - review, then use them",
  "only-empty-tables": "Table exists but has no rows - probably unused by the shop",
  "column-hints-only": "No table by that name; only column-name hints",
  "not-found": "Nothing found - needs a new erp table",
};

export function renderConceptsMd(s: SchemaSnapshot, hits: ConceptHit[]): string {
  const out: string[] = [];
  out.push(`# ERP concept -> Textilesoft table probe (${s.database})`);
  out.push("");
  out.push("Name-based heuristic over table and column names. **It only suggests candidates; a person must confirm each one** by looking at the columns in SCHEMA.md.");
  out.push("");
  out.push("| Concept | ERP models | Result | If not in dbo |");
  out.push("|---|---|---|---|");
  for (const h of hits)
    out.push(`| ${h.concept.label} | ${cell(h.concept.erpModels)} | ${VERDICT_TEXT[h.verdict]} | ${cell(h.verdict === "candidate-in-dbo" ? "-" : h.concept.fallback)} |`);
  out.push("");
  for (const h of hits) {
    out.push(`## ${h.concept.label}`);
    out.push("");
    out.push(`Result: **${VERDICT_TEXT[h.verdict]}**`);
    out.push("");
    if (h.tables.length) {
      out.push("| Table | Rows | Columns |");
      out.push("|---|---|---|");
      for (const t of h.tables.slice(0, 25)) out.push(`| ${t.name} | ${t.rows.toLocaleString("en-US")} | ${t.columns} |`);
      if (h.tables.length > 25) out.push(`| ... ${h.tables.length - 25} more | | |`);
      out.push("");
    }
    if (h.columnOnly.length) {
      out.push("Column-name hints: " + h.columnOnly.map((c) => `${c.table}.${c.column}`).join(", "));
      out.push("");
    }
  }
  return out.join("\n");
}

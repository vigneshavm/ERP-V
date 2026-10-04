import { sqlDate } from './sqlDates.js';
import { openPool, loadDbConfig, type ShopDbPool } from './shopDbReader.js';
import { SqlWriteError } from './sqlWrite.js';
interface Definition { table: string; columns: string[]; group: string[]; date: string | null }
export const MENU_REPORTS: Record<string, Definition> = {
  "mrp-rate-change": {
    "table": "purentrydetails",
    "columns": [
      "ID",
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "prate",
      "mtr",
      "mrp",
      "cr_per",
      "cr_rate",
      "dis_per",
      "dis_amount",
      "mrpdisper",
      "mrpdisamt",
      "brand",
      "patrn",
      "size",
      "entry_date",
      "comboname",
      "costatus",
      "cqty",
      "cqtysets",
      "corate"
    ],
    "group": [],
    "date": "entry_date"
  },
  "sales-rate-change-entry": {
    "table": "purentrydetails",
    "columns": [
      "ID",
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "prate",
      "mtr",
      "mrp",
      "cr_per",
      "cr_rate",
      "dis_per",
      "dis_amount",
      "mrpdisper",
      "mrpdisamt",
      "brand",
      "patrn",
      "size",
      "entry_date",
      "comboname",
      "costatus",
      "cqty",
      "cqtysets",
      "corate"
    ],
    "group": [],
    "date": "entry_date"
  },
  "barcode-wise-discount": {
    "table": "purentrydetails",
    "columns": [
      "ID",
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "prate",
      "mtr",
      "mrp",
      "cr_per",
      "cr_rate",
      "dis_per",
      "dis_amount",
      "mrpdisper",
      "mrpdisamt",
      "brand",
      "patrn",
      "size",
      "entry_date",
      "comboname",
      "costatus",
      "cqty",
      "cqtysets",
      "corate"
    ],
    "group": [],
    "date": "entry_date"
  },
  "barcode-rate-change": {
    "table": "purentrydetails",
    "columns": [
      "ID",
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "prate",
      "mtr",
      "mrp",
      "cr_per",
      "cr_rate",
      "dis_per",
      "dis_amount",
      "mrpdisper",
      "mrpdisamt",
      "brand",
      "patrn",
      "size",
      "entry_date",
      "comboname",
      "costatus",
      "cqty",
      "cqtysets",
      "corate"
    ],
    "group": [],
    "date": "entry_date"
  },
  "barcode-mtr-rate-change": {
    "table": "purentrydetails",
    "columns": [
      "ID",
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "prate",
      "mtr",
      "mrp",
      "cr_per",
      "cr_rate",
      "dis_per",
      "dis_amount",
      "mrpdisper",
      "mrpdisamt",
      "brand",
      "patrn",
      "size",
      "entry_date",
      "comboname",
      "costatus",
      "cqty",
      "cqtysets",
      "corate"
    ],
    "group": [],
    "date": "entry_date"
  },
  "combo-detail": {
    "table": "purentrydetails",
    "columns": [
      "ID",
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "prate",
      "mtr",
      "mrp",
      "cr_per",
      "cr_rate",
      "dis_per",
      "dis_amount",
      "mrpdisper",
      "mrpdisamt",
      "brand",
      "patrn",
      "size",
      "entry_date",
      "comboname",
      "costatus",
      "cqty",
      "cqtysets",
      "corate"
    ],
    "group": [
      "comboname"
    ],
    "date": "entry_date"
  },
  "date-wise": {
    "table": "sales2",
    "columns": [
      "No",
      "billno",
      "cus_card",
      "cus_name",
      "mode",
      "date",
      "paymenttype",
      "billamt",
      "tot_qty",
      "tmtr",
      "countername",
      "bill_status",
      "status"
    ],
    "group": [
      "date"
    ],
    "date": "date"
  },
  "mode-wise": {
    "table": "sales2",
    "columns": [
      "No",
      "billno",
      "cus_card",
      "cus_name",
      "mode",
      "date",
      "paymenttype",
      "billamt",
      "tot_qty",
      "tmtr",
      "countername",
      "bill_status",
      "status"
    ],
    "group": [
      "mode"
    ],
    "date": "date"
  },
  "company-wise": {
    "table": "salsntry",
    "columns": [
      "No",
      "srl_no",
      "barcode",
      "p_name",
      "qty",
      "mtr",
      "rate",
      "net_amount",
      "cgst",
      "sgst",
      "tax",
      "GSTPer",
      "hsncode",
      "mode",
      "date",
      "company_name",
      "sls_man",
      "patt",
      "size",
      "brand",
      "billno",
      "status"
    ],
    "group": [
      "company_name"
    ],
    "date": "date"
  },
  "salesman": {
    "table": "salsntry",
    "columns": [
      "No",
      "srl_no",
      "barcode",
      "p_name",
      "qty",
      "mtr",
      "rate",
      "net_amount",
      "cgst",
      "sgst",
      "tax",
      "GSTPer",
      "hsncode",
      "mode",
      "date",
      "company_name",
      "sls_man",
      "patt",
      "size",
      "brand",
      "billno",
      "status"
    ],
    "group": [
      "sls_man"
    ],
    "date": "date"
  },
  "customer": {
    "table": "sales2",
    "columns": [
      "No",
      "billno",
      "cus_card",
      "cus_name",
      "mode",
      "date",
      "paymenttype",
      "billamt",
      "tot_qty",
      "tmtr",
      "countername",
      "bill_status",
      "status"
    ],
    "group": [
      "cus_card"
    ],
    "date": "date"
  },
  "sales-gst": {
    "table": "salsntry",
    "columns": [
      "No",
      "srl_no",
      "barcode",
      "p_name",
      "qty",
      "mtr",
      "rate",
      "net_amount",
      "cgst",
      "sgst",
      "tax",
      "GSTPer",
      "hsncode",
      "mode",
      "date",
      "company_name",
      "sls_man",
      "patt",
      "size",
      "brand",
      "billno",
      "status"
    ],
    "group": [
      "GSTPer"
    ],
    "date": "date"
  },
  "invoice-sales": {
    "table": "sales2",
    "columns": [
      "No",
      "billno",
      "cus_card",
      "cus_name",
      "mode",
      "date",
      "paymenttype",
      "billamt",
      "tot_qty",
      "tmtr",
      "countername",
      "bill_status",
      "status"
    ],
    "group": [
      "billno"
    ],
    "date": "date"
  },
  "customer-points": {
    "table": "newcustomer",
    "columns": [
      "sl_nu",
      "card_number",
      "eng_name",
      "points",
      "creditbalance",
      "SaleBalance"
    ],
    "group": [
      "card_number"
    ],
    "date": null
  },
  "pattern-size-sales": {
    "table": "salsntry",
    "columns": [
      "No",
      "srl_no",
      "barcode",
      "p_name",
      "qty",
      "mtr",
      "rate",
      "net_amount",
      "cgst",
      "sgst",
      "tax",
      "GSTPer",
      "hsncode",
      "mode",
      "date",
      "company_name",
      "sls_man",
      "patt",
      "size",
      "brand",
      "billno",
      "status"
    ],
    "group": [
      "patt",
      "size"
    ],
    "date": "date"
  },
  "stock-report": {
    "table": "stockdetails",
    "columns": [
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "sales_qty",
      "sreturn_qty",
      "preturn_qty",
      "stock_aj",
      "tot_qty",
      "mrp",
      "prate",
      "mtr",
      "cr_rate",
      "cr_per",
      "brand",
      "patrn",
      "size",
      "model",
      "date"
    ],
    "group": [],
    "date": "date"
  },
  "brand-patternsizewise-stock-report": {
    "table": "stockdetails",
    "columns": [
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "sales_qty",
      "sreturn_qty",
      "preturn_qty",
      "stock_aj",
      "tot_qty",
      "mrp",
      "prate",
      "mtr",
      "cr_rate",
      "cr_per",
      "brand",
      "patrn",
      "size",
      "model",
      "date"
    ],
    "group": [
      "brand",
      "patrn",
      "size"
    ],
    "date": "date"
  },
  "new-datewise-stock-report": {
    "table": "stockdetails",
    "columns": [
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "sales_qty",
      "sreturn_qty",
      "preturn_qty",
      "stock_aj",
      "tot_qty",
      "mrp",
      "prate",
      "mtr",
      "cr_rate",
      "cr_per",
      "brand",
      "patrn",
      "size",
      "model",
      "date"
    ],
    "group": [
      "date"
    ],
    "date": "date"
  },
  "patternwise-supplier-sizewise-stock": {
    "table": "stockdetails",
    "columns": [
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "sales_qty",
      "sreturn_qty",
      "preturn_qty",
      "stock_aj",
      "tot_qty",
      "mrp",
      "prate",
      "mtr",
      "cr_rate",
      "cr_per",
      "brand",
      "patrn",
      "size",
      "model",
      "date"
    ],
    "group": [
      "patrn",
      "model",
      "size"
    ],
    "date": "date"
  },
  "pattern-supplier-sizewise-stock-report": {
    "table": "stockdetails",
    "columns": [
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "sales_qty",
      "sreturn_qty",
      "preturn_qty",
      "stock_aj",
      "tot_qty",
      "mrp",
      "prate",
      "mtr",
      "cr_rate",
      "cr_per",
      "brand",
      "patrn",
      "size",
      "model",
      "date"
    ],
    "group": [
      "patrn",
      "model",
      "size"
    ],
    "date": "date"
  },
  "barcode-sales-report": {
    "table": "salsntry",
    "columns": [
      "No",
      "srl_no",
      "barcode",
      "p_name",
      "qty",
      "mtr",
      "rate",
      "net_amount",
      "cgst",
      "sgst",
      "tax",
      "GSTPer",
      "hsncode",
      "mode",
      "date",
      "company_name",
      "sls_man",
      "patt",
      "size",
      "brand",
      "billno",
      "status"
    ],
    "group": [
      "barcode"
    ],
    "date": "date"
  },
  "barcode-stock-checking": {
    "table": "stockdetails",
    "columns": [
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "sales_qty",
      "sreturn_qty",
      "preturn_qty",
      "stock_aj",
      "tot_qty",
      "mrp",
      "prate",
      "mtr",
      "cr_rate",
      "cr_per",
      "brand",
      "patrn",
      "size",
      "model",
      "date"
    ],
    "group": [
      "barcode"
    ],
    "date": "date"
  },
  "purchase-return-report": {
    "table": "purretrun",
    "columns": [
      "sl_no",
      "sup_retu_grn",
      "supp_name",
      "cmy_name",
      "grn_no",
      "barcode",
      "pr_name",
      "qty",
      "mtr",
      "pr_rate",
      "mrp",
      "netamt",
      "date",
      "Return_Status"
    ],
    "group": [
      "sup_retu_grn"
    ],
    "date": "date"
  },
  "purchase-supplier-return": {
    "table": "purretrun",
    "columns": [
      "sl_no",
      "sup_retu_grn",
      "supp_name",
      "cmy_name",
      "grn_no",
      "barcode",
      "pr_name",
      "qty",
      "mtr",
      "pr_rate",
      "mrp",
      "netamt",
      "date",
      "Return_Status"
    ],
    "group": [
      "supp_name"
    ],
    "date": "date"
  },
  "companywise-purchase-report": {
    "table": "purgrnentry",
    "columns": [
      "ID",
      "grn_no",
      "cmy_name",
      "suplier_name",
      "invoce_amount",
      "invoce_date",
      "entry_date",
      "pnet_tot",
      "pay_type",
      "tot_qut"
    ],
    "group": [
      "cmy_name"
    ],
    "date": "entry_date"
  },
  "invoice-purchase-report": {
    "table": "purgrnentry",
    "columns": [
      "ID",
      "grn_no",
      "cmy_name",
      "suplier_name",
      "invoce_amount",
      "invoce_date",
      "entry_date",
      "pnet_tot",
      "pay_type",
      "tot_qut"
    ],
    "group": [
      "invoce_amount"
    ],
    "date": "entry_date"
  },
  "purchase-rate-check": {
    "table": "purentrydetails",
    "columns": [
      "ID",
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "prate",
      "mtr",
      "mrp",
      "cr_per",
      "cr_rate",
      "dis_per",
      "dis_amount",
      "mrpdisper",
      "mrpdisamt",
      "brand",
      "patrn",
      "size",
      "entry_date",
      "comboname",
      "costatus",
      "cqty",
      "cqtysets",
      "corate"
    ],
    "group": [
      "barcode"
    ],
    "date": "entry_date"
  },
  "purchase-report": {
    "table": "purgrnentry",
    "columns": [
      "ID",
      "grn_no",
      "cmy_name",
      "suplier_name",
      "invoce_amount",
      "invoce_date",
      "entry_date",
      "pnet_tot",
      "pay_type",
      "tot_qut"
    ],
    "group": [
      "grn_no"
    ],
    "date": "entry_date"
  },
  "barcodewise-discount-report": {
    "table": "purentrydetails",
    "columns": [
      "ID",
      "grn_no",
      "sl_no",
      "barcode",
      "pname",
      "qty",
      "fqty",
      "prate",
      "mtr",
      "mrp",
      "cr_per",
      "cr_rate",
      "dis_per",
      "dis_amount",
      "mrpdisper",
      "mrpdisamt",
      "brand",
      "patrn",
      "size",
      "entry_date",
      "comboname",
      "costatus",
      "cqty",
      "cqtysets",
      "corate"
    ],
    "group": [
      "barcode"
    ],
    "date": "entry_date"
  },
  "expenses-inout-report": {
    "table": "expenseentry",
    "columns": [
      "slno",
      "ex_no",
      "code",
      "exname",
      "exoutamt",
      "exinamt",
      "expens",
      "remarks",
      "date",
      "Counter_Name"
    ],
    "group": [
      "exname"
    ],
    "date": "date"
  },
  "supplier-view": {
    "table": "supplierdetail",
    "columns": [
      "code",
      "sup_name",
      "address",
      "city",
      "mb_nu",
      "gst_number",
      "agent_name",
      "credit_days"
    ],
    "group": [
      "sup_name"
    ],
    "date": null
  }
};
let connection: Promise<ShopDbPool> | undefined;
async function reader() {
  if (!connection) connection = openPool(loadDbConfig()).catch(error => { connection = undefined; throw error; });
  return connection;
}
export function calendarDate(value: unknown): string | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = typeof value === 'string' ? new Date(`${value}T00:00:00Z`) : new Date(NaN);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000') || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== value)
    throw new SqlWriteError('Use a valid YYYY-MM-DD date.',400);
  return value;
}
export async function nativeMenuReport(id: string, query: Record<string, unknown>) {
  if (!Object.hasOwn(MENU_REPORTS,id)) throw new SqlWriteError('Unknown report.',404);
  const definition = MENU_REPORTS[id];
  if (!definition) throw new SqlWriteError('Unknown report.',404);
  const from = calendarDate(query.from), to = calendarDate(query.to);
  if (from && to && from > to) throw new SqlWriteError('From date must not follow To date.',400);
  if (!definition.date && (from || to)) throw new SqlWriteError('This directory has no date-range report.',400);
  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw new SqlWriteError('Invalid page.',400);
  const pool = await reader();
  // Verify the target's existing columns before reading business records; never heal or create storage.
  const metadataRequest = pool.request(); metadataRequest.input('table',definition.table);
  const metadata = await metadataRequest.query("SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME=@table");
  const found = new Set(metadata?.recordset.map(row=>String(row.name).toLowerCase()));
  if (definition.columns.some(column=>!found.has(column.toLowerCase()))) throw new SqlWriteError('Existing SQL columns required by this report are unavailable.',503,'SQL_REPORT_STORAGE_UNAVAILABLE');
  const request = pool.request();
  request.input('skip',(page-1)*500); request.input('take',501);
  const conditions: string[] = [];
  const date = definition.date ? sqlDate(`[${definition.date}]`) : '';
  if(from){request.input('from',from);conditions.push(`${date} >= CONVERT(date,@from,23)`);}
  if(to){request.input('to',to);conditions.push(`${date} <= CONVERT(date,@to,23)`);}
  if(query.barcode !== undefined && query.barcode !== '') {
    if(!definition.columns.includes('barcode') || typeof query.barcode !== 'string' || query.barcode.length>128) throw new SqlWriteError('Invalid barcode filter.',400);
    request.input('barcode',query.barcode); conditions.push('[barcode]=@barcode');
  }
  if(id==='combo-detail') conditions.push("NULLIF(LTRIM(RTRIM([comboname])),'') IS NOT NULL");
  const order = Array.from(new Set([...definition.group,...definition.columns]));
  const result = await request.query(`SELECT ${definition.columns.map(c=>`[${c}]`).join(',')} FROM dbo.[${definition.table}] ${conditions.length?'WHERE '+conditions.join(' AND '):''} ORDER BY ${order.map(c=>`[${c}]`).join(',')} OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY`);
  const rows = result?.recordset ?? [];
  return { rows:rows.slice(0,500), columns:definition.columns, page, hasMore:rows.length>500, group:definition.group, dateColumn:definition.date, source:'textilesoft-sql', scope:'Native SQL rows; grouping is sort order, not reconciled aggregate totals. Saved statuses are retained. Stock quantities are stored fields, not reconstructed historical balances. Dates filter the displayed native date column. No loyalty movement ledger is inferred from current points.' };
}

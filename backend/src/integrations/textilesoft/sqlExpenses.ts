/** Lossy ERP expense adapter over the existing Textilesoft dbo.expenseentry table. */
import { sqlDate } from "./sqlDates.js";
import { sqlRead } from "./sqlWrite.js";

export interface SqlExpense {
  _id: string;
  id: string;
  expenseNo: string;
  date: Date;
  category: string;
  amount: number;
  paymentMethod: string;
  description: string;
  createdBy: string;
  tenantId: string;
}

const expenseFromRow = (row: Record<string, unknown>): SqlExpense => {
  const rawDate = String(row.date ?? "");
  const date = /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)
    ? new Date(Number(rawDate.slice(6)), Number(rawDate.slice(3, 5)) - 1, Number(rawDate.slice(0, 2)))
    : new Date(rawDate);
  const id = String(row.ex_no ?? row.slno ?? "");
  return {
    _id: id,
    id,
    expenseNo: String(row.ex_no ?? row.code ?? row.slno ?? ""),
    date: Number.isNaN(date.getTime()) ? new Date(0) : date,
    category: String(row.exname ?? "Other"),
    amount: Number(row.exoutamt ?? 0),
    paymentMethod: "cash",
    description: String(row.expens ?? row.remarks ?? ""),
    createdBy: "",
    tenantId: "",
  };
};

const rowSelect = `SELECT slno, code, exname, exoutamt, expens, remarks, ex_no, [date], Counter_Name
  FROM dbo.expenseentry`;

export async function listSqlExpenses(): Promise<SqlExpense[]> {
  const rows = await sqlRead(`${rowSelect} ORDER BY ${sqlDate("[date]")} DESC, slno DESC`);
  return rows.map(expenseFromRow);
}

export async function findSqlExpense(id: string): Promise<SqlExpense | null> {
  const [row] = await sqlRead(`${rowSelect} WHERE CONVERT(nvarchar(100), ex_no) = @id`, { id });
  return row ? expenseFromRow(row) : null;
}


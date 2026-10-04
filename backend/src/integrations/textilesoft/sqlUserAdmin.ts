/**
 * User edits that map onto Textilesoft's EXISTING tables and columns -- no schema change, no new tables:
 *
 *   dbo.newuser         name                         (one row per user_id + counter, so all rows are kept in step)
 *   dbo.specialcondion  bill_discount, dis_per       (billing discount permission / highest bill discount %)
 *
 * Only UPDATEs of rows that already exist. A user with no specialcondion row is refused (404) rather than
 * given a new row, because that table has many other permission columns that only Textilesoft should seed.
 */
import {
  withSqlTransaction,
  sqlRead,
  SqlWriteError,
  txt,
} from "./sqlWrite.js";

const yes = (v: unknown): boolean => /^(yes|y|1|true)$/i.test(txt(v));

/** user_id (upper-case) -> highest bill discount %. 0 = not allowed, null = allowed with no cap. */
export async function readDiscountLimits(): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  try {
    const rows = await sqlRead(
      "SELECT user_id, bill_discount, dis_per FROM dbo.[specialcondion]",
    );
    for (const r of rows) {
      const key = txt(r.user_id).toUpperCase();
      if (!key) continue;
      let v: number | null;
      if (!yes(r.bill_discount)) v = 0;
      else {
        const n = Number(txt(r.dis_per));
        v = txt(r.dis_per) === "" || !Number.isFinite(n) || n < 0 ? null : n;
      }
      // Several counters per user: the most permissive row wins (null = no cap beats any number).
      if (!out.has(key)) out.set(key, v);
      else {
        const cur = out.get(key)!;
        out.set(key, cur === null || v === null ? null : Math.max(cur, v));
      }
    }
  } catch {
    // no specialcondion table: no limits to show
  }
  return out;
}

async function loginOf(
  tx: { query: (t: string, p?: Record<string, unknown>) => Promise<Record<string, unknown>[]> },
  sqlUserId: number,
): Promise<string> {
  const [u] = await tx.query(
    "SELECT user_id FROM dbo.[newuser] WHERE NewUser_ID = @id",
    { id: sqlUserId },
  );
  const login = txt(u?.user_id);
  if (!login) throw new SqlWriteError("User not found.", 404);
  return login;
}

/** Sets the user's highest bill discount % (0 = no bill discount). Existing specialcondion rows only. */
export async function setUserDiscountLimit(
  sqlUserId: number,
  percent: number,
): Promise<void> {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100)
    throw new SqlWriteError("Discount limit must be between 0 and 100.", 400);
  await withSqlTransaction("Updating the discount limit", async (tx) => {
    const login = await loginOf(tx, sqlUserId);
    const n = await tx.update(
      "specialcondion",
      {
        bill_discount: percent > 0 ? "Yes" : "No",
        dis_per: String(percent),
      },
      { user_id: login },
    );
    if (!n)
      throw new SqlWriteError(
        `Textilesoft has no billing-permission row for "${login}" (dbo.specialcondion), so the limit can't be set from the ERP.`,
        404,
      );
  });
}

/** Renames the user in every dbo.newuser row of the same login (one row per counter). */
export async function renameSqlUser(
  sqlUserId: number,
  name: string,
): Promise<void> {
  const clean = txt(name);
  if (!clean) throw new SqlWriteError("Name can't be empty.", 400);
  await withSqlTransaction("Updating the user", async (tx) => {
    const login = await loginOf(tx, sqlUserId);
    await tx.update("newuser", { name: clean }, { user_id: login });
  });
}

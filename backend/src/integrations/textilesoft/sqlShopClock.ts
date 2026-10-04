import { SESSION_PREFIX } from "./mapping.js";
import { getPool } from "./sqlItemSource.js";

let asOfCache: { at: number; value: string | null } | undefined;
let asOfPending: Promise<string | null> | undefined;

/** (Read from the bill headers, dbo.sales2 -- one row per bill -- not the much larger line table.)
 * Newest sale date in the shop data (yyyy-mm-dd). Reports count ages back from it, so a restored backup still fills the screens. */
export async function shopAsOf(): Promise<string | null> {
  if (asOfCache && Date.now() - asOfCache.at < 60_000) return asOfCache.value;
  if (asOfPending) return asOfPending;

  const pending = (async () => {
    const res = await (await getPool())
      .request()
      .query(
        SESSION_PREFIX +
          "SELECT CONVERT(varchar(10), MAX([date]), 23) AS d FROM dbo.sales2",
      );
    const r = res?.recordset?.[0];
    const value = r?.d ? String(r.d) : null;
    asOfCache = { at: Date.now(), value };
    return value;
  })();
  asOfPending = pending;
  try {
    return await pending;
  } finally {
    if (asOfPending === pending) asOfPending = undefined;
  }
}

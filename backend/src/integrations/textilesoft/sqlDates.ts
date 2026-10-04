/**
 * Textilesoft's database runs at compatibility level 100, where TRY_CONVERT does not exist (TRY_CAST does).
 * `sqlDate(col)` turns a text/date column holding "yyyy-MM-dd" or "dd/MM/yyyy" into a `date`, or NULL when
 * it is blank or not a real date. It builds an unambiguous yyyymmdd string first, so ISDATE does not depend on
 * the session's language / DATEFORMAT.
 */
export function sqlDate(col: string): string {
  const x = `LTRIM(RTRIM(CONVERT(varchar(40), ${col}, 23)))`;
  const iso = `REPLACE(LEFT(${x}, 10), '-', '')`;
  const dmy = `SUBSTRING(${x}, 7, 4) + SUBSTRING(${x}, 4, 2) + LEFT(${x}, 2)`;
  return `COALESCE(
    CASE WHEN ${x} LIKE '[12][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]%' AND ISDATE(${iso}) = 1 THEN CONVERT(date, ${iso}, 112) END,
    CASE WHEN ${x} LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]%' AND ISDATE(${dmy}) = 1 THEN CONVERT(date, ${dmy}, 112) END)`;
}

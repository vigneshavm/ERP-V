/**
 * Search / sort / paginate for report tables that are small enough to hold in memory after SQL has done the
 * GROUP BY (e.g. one row per supplier or customer). Pure -- no DB access.
 */

export interface TableQuery {
    search?: string;
    sort?: string;
    dir?: string; // asc | desc
    page?: string | number;
    limit?: string | number;
}

export interface TableSpec<T> {
    /** Text fields matched (case-insensitive substring) by ?search=. */
    searchIn: (row: T) => (string | null | undefined)[];
    /** Whitelisted sort columns. */
    sortable: Record<string, (row: T) => string | number | null | undefined>;
    /** Order when ?sort= is absent or unknown. */
    fallback: (a: T, b: T) => number;
    /** Stable tie-breaker so paging never repeats or skips a row. */
    tieBreak: (row: T) => string;
}

export function tableQuery<T>(rows: T[], q: TableQuery, spec: TableSpec<T>) {
    const term = (q.search ?? "").trim().toLowerCase();
    const matched = term ? rows.filter((r) => spec.searchIn(r).some((v) => (v ?? "").toLowerCase().includes(term))) : rows;

    const col = q.sort && Object.prototype.hasOwnProperty.call(spec.sortable, q.sort) ? spec.sortable[q.sort] : null;
    const dir: "asc" | "desc" = q.dir === "asc" ? "asc" : "desc";
    const sign = dir === "asc" ? 1 : -1;
    const blank = (v: unknown) => v === null || v === undefined || v === "";
    const sorted = [...matched].sort(
        col
            ? (a, b) => {
                  const va = col(a), vb = col(b);
                  if (blank(va) !== blank(vb)) return blank(va) ? 1 : -1; // blanks last either way
                  const c = blank(va) ? 0 : typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" });
                  return c * sign || spec.tieBreak(a).localeCompare(spec.tieBreak(b));
              }
            : (a, b) => spec.fallback(a, b) || spec.tieBreak(a).localeCompare(spec.tieBreak(b)),
    );

    const limit = Math.min(200, Math.max(1, parseInt(String(q.limit)) || 50));
    const pages = Math.max(1, Math.ceil(sorted.length / limit));
    const page = Math.min(pages, Math.max(1, parseInt(String(q.page)) || 1));
    return {
        matched: sorted,
        items: sorted.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: sorted.length, pages },
        sort: col ? q.sort! : null,
        dir,
    };
}

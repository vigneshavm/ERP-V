/**
 * Where the ERP reads its item catalogue and stock levels from.
 *
 *   ITEM_DATA_SOURCE=mongo  (default) - the ERP's own MongoDB.
 *   ITEM_DATA_SOURCE=sql              - the shop's Textilesoft SQL Server database (read-only), with
 *                                       ERP-side sales/purchases/adjustments kept in MongoDB and
 *                                       layered on top (see integrations/textilesoft/sqlItemSource.ts).
 *
 * Only item and stock READS switch. Customers, suppliers, invoices, etc. always stay on MongoDB, and
 * nothing is ever written to the shop database.
 */
export type ItemDataSource = "mongo" | "sql";

export function getItemDataSource(env: NodeJS.ProcessEnv = process.env): ItemDataSource {
    const raw = (env.ITEM_DATA_SOURCE ?? "mongo").trim().toLowerCase();
    if (raw === "" || raw === "mongo" || raw === "mongodb") return "mongo";
    if (raw === "sql" || raw === "sqlserver" || raw === "textilesoft") return "sql";
    throw new Error(`Invalid ITEM_DATA_SOURCE "${env.ITEM_DATA_SOURCE}" - use "mongo" or "sql"`);
}

export const isSqlItemSource = (): boolean => getItemDataSource() === "sql";

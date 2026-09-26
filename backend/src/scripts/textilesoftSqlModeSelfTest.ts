// Offline self-test for ITEM_DATA_SOURCE=sql (query building + Mongo overlay, stubbed models). Run: npm run selftest:sql-mode
import assert from "node:assert/strict";
import { Types } from "mongoose";
import Item from "../modules/inventory/models/Item.js";
import StockLog from "../modules/inventory/models/StockLog.js";
import { buildItemPageQueries, buildStatsQuery, validateMapping } from "../integrations/textilesoft/mapping.js";
import { materializeShopItems } from "../integrations/textilesoft/sqlItemOverlay.js";
import { getItemDataSource } from "../config/itemDataSource.js";
import { mirrorRows } from "../integrations/textilesoft/sqlItemSource.js";

// flag parsing
assert.equal(getItemDataSource({} as any), "mongo");
assert.equal(getItemDataSource({ ITEM_DATA_SOURCE: "SQL" } as any), "sql");
assert.equal(getItemDataSource({ ITEM_DATA_SOURCE: "mongodb" } as any), "mongo");
assert.throws(() => getItemDataSource({ ITEM_DATA_SOURCE: "oracle" } as any));

const mapping = validateMapping({
    source: { table: "dbo.newproduct" },
    columns: { name: "pname", sku: "code", barcode: "barcode", sellingPrice: "mrp", costPrice: "prate", category: "cat" },
    stock: { table: "dbo.stockdetails", keyColumn: "barcode", sourceKeyColumn: "barcode", qtyColumn: "qty" },
});
const q = buildItemPageQueries(mapping, { search: "tow_el%", category: "X", offset: 20, limit: 10, lowStockOnly: true, lowStockDefault: 5 });
console.log(q.page.text, "\n", q.page.params, "\n", q.count.text);
assert.match(q.page.text, /OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY/);
assert.match(q.page.text, /LIKE @q ESCAPE/);
assert.equal(q.page.params.find((p) => p.name === "q")!.value, "%tow\\_el\\%%");
assert.ok(!/brand/.test(q.page.text)); // unmapped fields ignored
assert.ok(buildStatsQuery(mapping, 5).text.includes("COUNT(*) AS totalItems"));

// overlay: existing item with ERP sales, plus a new one
const tenant = new Types.ObjectId().toString();
const existingId = new Types.ObjectId();
const written: any[] = [];
const logs: any[] = [];
(Item as any).find = () => ({ lean: async () => [{ _id: existingId, name: "TOWEL", barcode: "2225111", sku: "54", stockQty: 25, sellingPrice: 150 }] });
(Item as any).bulkWrite = async (ops: any[]) => { written.push(...ops); };
(StockLog as any).aggregate = async () => [{ _id: existingId, delta: -5 }]; // ERP sold 5
(StockLog as any).insertMany = async (l: any[]) => { logs.push(...l); };

const out = await materializeShopItems([
    { name: "TOWEL", barcode: "2225111", sku: "54", unit: "pcs", costPrice: 112, sellingPrice: 155, stockQty: 30 },
    { name: "SHIRT", barcode: "999", unit: "pcs", costPrice: 1, sellingPrice: 2, stockQty: 7 },
], tenant);

assert.equal(out[0].stockQty, 25);            // shop 30 + ERP -5
assert.equal(out[0].sellingPrice, 155);       // price refreshed from shop
assert.equal(out[0].availableQuantity, 25);
assert.equal(out[1].stockQty, 7);             // new mirrored item starts at shop stock
assert.equal(written.filter((o) => o.insertOne).length, 1);
assert.equal(written.filter((o) => o.updateOne).length, 1); // price changed 150 -> 155, stock 25 unchanged
assert.equal(logs.length, 1);
assert.equal(logs[0].type, "INIT");

// full mirror over streamed batches: 2 batches -> all rows materialised, bad row skipped
async function* batches() {
    yield [{ name: "A", barcode: "1", sellingPrice: "10", costPrice: "5", stockQty: 3 }, { name: "", barcode: "2", sellingPrice: "10" }];
    yield [{ name: "B", barcode: "3", sellingPrice: "20", costPrice: "9", stockQty: 0 }];
}
written.length = 0;
(Item as any).find = () => ({ lean: async () => [] });
(StockLog as any).aggregate = async () => [];
const mirrored = await mirrorRows(tenant, batches(), mapping);
assert.deepEqual(mirrored, { items: 2, skipped: 1 });
assert.equal(written.filter((o) => o.insertOne).length, 2);
console.log("ALL OK");

/** Product master (Textilesoft dbo.newproduct) -- see integrations/textilesoft/sqlProducts.ts. */
import { Router } from "express";
import { protect, authorize } from "../../../middlewares/authMiddleware.js";
import { SqlWriteError } from "../../../integrations/textilesoft/sqlWrite.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  productFormOptions,
} from "../../../integrations/textilesoft/sqlProducts.js";
import {
  suggestAttribute,
  replaceProductMapping,
  ATTRIBUTES,
} from "../../../integrations/textilesoft/sqlAttributes.js";

const q = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
const manage = authorize("owner", "co-owner", "manager");

const router = Router();
router.use(protect);

router.get(
  "/options",
  sql(async (_req, res) => {
    res.json({ success: true, data: await productFormOptions() });
  }),
);
router.get(
  "/",
  sql(async (req, res) => {
    res.json({
      success: true,
      data: await listProducts({
        search: q(req.query.search),
        company: q(req.query.company),
        group: q(req.query.group),
      }),
    });
  }),
);
router.get(
  "/:code",
  sql(async (req, res) => {
    const p = await getProduct(String(req.params.code));
    if (!p) throw new SqlWriteError("Product not found.", 404);
    res.json({ success: true, data: p });
  }),
);
router.post(
  "/",
  manage,
  sql(async (req, res) => {
    res
      .status(201)
      .json({ success: true, data: await createProduct(req.body ?? {}) });
  }),
);
router.put(
  "/:code",
  manage,
  sql(async (req, res) => {
    res.json({
      success: true,
      data: await updateProduct(String(req.params.code), req.body ?? {}),
    });
  }),
);
router.delete(
  "/:code",
  manage,
  sql(async (req, res) => {
    await deleteProduct(String(req.params.code));
    res.json({ success: true });
  }),
);
// Product-wise rack / fashion mapping (body: { values: string[] }).
router.put(
  "/:code/:kind(racks|fashions)",
  manage,
  sql(async (req, res) => {
    const kind = req.params.kind === "racks" ? "rack" : "fashion";
    res.json({
      success: true,
      data: await replaceProductMapping(
        kind,
        String(req.params.code),
        Array.isArray(req.body?.values) ? req.body.values : [],
      ),
    });
  }),
);

export default router;

/**
 * Attribute suggestions (brand, pattern, size, colour, style, design, model, rack, fashion) from Textilesoft's
 * masters + purchase history. Mounted at /api/product-attributes.
 *   GET /                 -> the attribute names
 *   GET /:attribute?q=&supplier=&productCode=&limit=
 */
export const attributeRouter = Router();
attributeRouter.use(protect);
attributeRouter.get("/", (_req, res) => {
  res.json({ success: true, data: Object.keys(ATTRIBUTES) });
});
attributeRouter.get(
  "/:attribute",
  sql(async (req, res) => {
    res.json({
      success: true,
      data: await suggestAttribute(String(req.params.attribute), {
        q: q(req.query.q),
        supplier: q(req.query.supplier),
        productCode: q(req.query.productCode),
        limit: Number(req.query.limit) || undefined,
      }),
    });
  }),
);

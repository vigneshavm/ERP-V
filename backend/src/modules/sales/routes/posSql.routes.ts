import express from "express";
import {
  getPosCounters,
  getPosBillingLimits,
  getReturnSources,
  previewInvoice,
  createInvoice,
} from "../controllers/PosSqlController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import { sqlRead, txt } from "../../../integrations/textilesoft/sqlWrite.js";

// SQL-only POS routes (no MongoDB). The old Mongo-backed posInvoice.routes.ts is no longer mounted.
const router = express.Router();

router.get("/counters", protect, getPosCounters);
router.get("/billing-limits", protect, getPosBillingLimits);
router.get("/return-sources", protect, getReturnSources);
/**
 * Product Types for POS Quick Entry, read from Textilesoft: the product groups (dbo.progroup) and sub groups
 * (dbo.prosubgroup), each with the unit most of its products use (dbo.newproduct.unit_de). No GST rate is
 * offered here -- Textilesoft keeps GST per product (gst_group), not per group, so Quick Entry asks for it.
 */
router.get(
  "/product-types",
  protect,
  sql(async (_req, res) => {
    const groups = await sqlRead(
      `SELECT LTRIM(RTRIM(g.name_eng)) AS name,
              (SELECT TOP 1 LTRIM(RTRIM(p.unit_de)) FROM dbo.[newproduct] p
                WHERE LTRIM(RTRIM(p.group_name)) = LTRIM(RTRIM(g.name_eng)) AND NULLIF(LTRIM(RTRIM(p.unit_de)), '') IS NOT NULL
                GROUP BY LTRIM(RTRIM(p.unit_de)) ORDER BY COUNT(*) DESC) AS unit
         FROM dbo.[progroup] g WHERE NULLIF(LTRIM(RTRIM(g.name_eng)), '') IS NOT NULL ORDER BY name`,
    );
    const subs = await sqlRead(
      `SELECT LTRIM(RTRIM(s.name_eng)) AS name,
              (SELECT TOP 1 LTRIM(RTRIM(p.unit_de)) FROM dbo.[newproduct] p
                WHERE LTRIM(RTRIM(p.sub_group_name)) = LTRIM(RTRIM(s.name_eng)) AND NULLIF(LTRIM(RTRIM(p.unit_de)), '') IS NOT NULL
                GROUP BY LTRIM(RTRIM(p.unit_de)) ORDER BY COUNT(*) DESC) AS unit
         FROM dbo.[prosubgroup] s WHERE NULLIF(LTRIM(RTRIM(s.name_eng)), '') IS NOT NULL ORDER BY name`,
    );
    const seen = new Set<string>();
    const out: { name: string; defaultUnit?: string }[] = [];
    for (const r of [...groups, ...subs]) {
      const name = txt(r.name);
      if (!name || seen.has(name.toUpperCase())) continue;
      seen.add(name.toUpperCase());
      out.push({ name, defaultUnit: txt(r.unit) || undefined });
    }
    res.json({ success: true, data: out });
  }),
);

router.get(
  "/quick-products",
  protect,
  sql(async (_req, res) => {
    // Read-only: every Textilesoft product (newproduct) for POS Quick Entry; GST % via gstgroup.gst_name.
    const rows = await sqlRead(
      `SELECT LTRIM(RTRIM(p.code)) AS code, LTRIM(RTRIM(p.name)) AS name,
              LTRIM(RTRIM(p.group_name)) AS grp, LTRIM(RTRIM(p.sub_group_name)) AS sub,
              LTRIM(RTRIM(p.unit_de)) AS unit,
              TRY_CAST(p.Retail_Rate AS float) AS rate, TRY_CAST(p.mrp AS float) AS mrp,
              (SELECT TOP 1 TRY_CAST(g.gst AS float) FROM dbo.[gstgroup] g
                WHERE LTRIM(RTRIM(g.gst_name)) = LTRIM(RTRIM(p.gst_group))) AS gst
         FROM dbo.[newproduct] p
        WHERE NULLIF(LTRIM(RTRIM(p.name)), '') IS NOT NULL
        ORDER BY name`,
    );
    const data = rows.map((r: any) => ({
      code: txt(r.code) || undefined,
      name: txt(r.name),
      group: txt(r.grp) || txt(r.sub) || undefined,
      unit: txt(r.unit) || undefined,
      price: Number(r.rate) > 0 ? Number(r.rate) : Number(r.mrp) > 0 ? Number(r.mrp) : undefined,
      gstRate: r.gst != null && !isNaN(Number(r.gst)) ? Number(r.gst) : undefined,
    }));
    res.json({ success: true, data });
  }),
);

router.post("/invoice/preview", protect, previewInvoice);
router.post("/invoice", protect, createInvoice);

export default router;

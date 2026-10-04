import express from "express";
import {
  createReturn,
  getAllReturns,
  getReturnById,
  deleteReturn,
} from "../controllers/ReturnController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { requirePermission } from "../../../middlewares/rbacMiddleware.js";
import { auditDelete } from "../../../middlewares/auditMiddleware.js";
import { isSqlItemSource } from "../../../config/itemDataSource.js";
import {
  createSqlSalesReturn,
  listSqlSalesReturns,
  getSqlSalesReturn,
  deleteSqlSalesReturn,
  isSqlSalesReturnId,
} from "../../../integrations/textilesoft/sqlSalesReturn.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
const router = express.Router();
router.post("/", protect, (req, res, next) =>
  isSqlItemSource()
    ? sql(async (r, out) =>
        out
          .status(201)
          .json({
            success: true,
            data: await createSqlSalesReturn(r.body ?? {}),
          }),
      )(req, res, next)
    : createReturn(req, res),
);
router.get("/", protect, (req, res, next) =>
  isSqlItemSource()
    ? sql(async (_r, out) => out.json(await listSqlSalesReturns()))(
        req,
        res,
        next,
      )
    : getAllReturns(req, res),
);
router.get("/:id", protect, (req, res, next) =>
  isSqlItemSource() && isSqlSalesReturnId(String(req.params.id))
    ? sql(async (r, out) =>
        out.json(await getSqlSalesReturn(String(r.params.id))),
      )(req, res, next)
    : getReturnById(req, res),
);
router.delete(
  "/:id",
  protect,
  requirePermission("delete:return"),
  auditDelete("Return", "DELETE_RETURN"),
  (req, res, next) =>
    isSqlItemSource() && isSqlSalesReturnId(String(req.params.id))
      ? sql(async (r, out) => {
          await deleteSqlSalesReturn(String(r.params.id));
          out.json({ success: true });
        })(req, res, next)
      : deleteReturn(req, res),
);
export default router;

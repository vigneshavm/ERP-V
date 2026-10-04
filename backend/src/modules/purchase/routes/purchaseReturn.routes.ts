import express from "express";
import { container } from "tsyringe";
import { protect, authorize } from "../../../middlewares/authMiddleware.js";
import { validate } from "../../../middlewares/validate.js";
import { PurchaseReturnController } from "../controllers/PurchaseReturnController.js";
import {
  createPurchaseReturnValidators,
  purchaseReturnIdValidators,
} from "../validators/purchaseReturnValidators.js";
import { isSqlItemSource } from "../../../config/itemDataSource.js";
import {
  createSqlPurchaseReturn,
  listSqlPurchaseReturns,
  getSqlPurchaseReturn,
  deleteSqlPurchaseReturn,
} from "../../../integrations/textilesoft/sqlPurchaseReturn.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";

const router = express.Router();

/** Runs middlewares in order (used to keep the MongoDB routes' id validation behind the SQL/Mongo switch). */
type Mw = (req: express.Request, res: express.Response, next: express.NextFunction) => unknown;
const chain =
  (...mws: Mw[]): Mw =>
  (req, res, next) => {
    let i = 0;
    const step = (err?: unknown): unknown => {
      if (err) return next(err);
      const mw = mws[i++];
      return mw ? mw(req, res, step as express.NextFunction) : undefined;
    };
    return step();
  };
const controller = container.resolve(PurchaseReturnController);
router.use(protect);
router.post(
  "/",
  ...(isSqlItemSource()
    ? [
        sql(async (r, out) =>
          out
            .status(201)
            .json({
              success: true,
              data: await createSqlPurchaseReturn(r.body ?? {}),
            }),
        ),
      ]
    : [...createPurchaseReturnValidators, validate, controller.create]),
);
router.get("/", (req, res, next) =>
  isSqlItemSource()
    ? sql(async (_r, out) =>
        out.json({ success: true, data: await listSqlPurchaseReturns() }),
      )(req, res, next)
    : controller.list(req, res, next),
);
router.get("/:id", (req, res, next) =>
  isSqlItemSource() && String(req.params.id).startsWith("sql:pr:")
    ? sql(async (r, out) =>
        out.json({
          success: true,
          data: await getSqlPurchaseReturn(String(r.params.id)),
        }),
      )(req, res, next)
    : chain(...(purchaseReturnIdValidators as unknown as Mw[]), validate as unknown as Mw, controller.getById as unknown as Mw)(req, res, next),
);
// Deleting a Textilesoft return puts the goods back into stock and changes what the supplier owes:
// owners / managers only, as for deleting a purchase entry. (MongoDB mode unchanged.)
router.delete("/:id", (req, res, next) =>
  isSqlItemSource() && String(req.params.id).startsWith("sql:pr:")
    ? authorize("owner", "co-owner", "manager")(req, res, (err?: unknown) =>
        err
          ? next(err)
          : sql(async (r, out) => {
              await deleteSqlPurchaseReturn(String(r.params.id));
              out.json({ success: true });
            })(req, res, next),
      )
    : chain(...(purchaseReturnIdValidators as unknown as Mw[]), validate as unknown as Mw, controller.remove as unknown as Mw)(req, res, next),
);
export default router;

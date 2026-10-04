import type { Types } from "mongoose";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      /** Resolved tenant id. Single-shop deployment: always the configured SHOP_TENANT_ID, set for
       *  every request (not just authenticated ones) so pre-auth code paths can read it too.
       *  `protect` re-sets it from the signed-in Textilesoft user (same value in practice). */
      tenantId: Types.ObjectId;
      tenantSlug?: string;
    }
  }
}

/**
 * Single-shop deployment: there is no per-request tenant lookup (Textilesoft's SQL database is
 * one shop, not a multi-tenant directory). Every request gets the shop's fixed SHOP_TENANT_ID.
 */
export const tenantResolver = (req: Request, _res: Response, next: NextFunction) => {
  const raw = String(process.env.SHOP_TENANT_ID ?? "").trim();
  if (/^[a-f\d]{24}$/i.test(raw)) {
    req.tenantId = raw as unknown as Types.ObjectId;
  }
  next();
};

export default tenantResolver;

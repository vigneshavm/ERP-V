import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

/**
 * For routes WITHOUT `protect` that still act on one shop's data (e.g. a public storefront):
 * rejects the request unless `tenantResolver` found a tenant for the host. `tenantResolver` on its
 * own never blocks -- it only resolves. Routes behind `protect` don't need this: `protect` takes
 * the tenant from the signed-in user and fails closed. See docs/backend-architecture.md §6.
 */
export const requireTenant = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.tenantId) {
        next(new AppError("Shop not found for this address", 404, "TENANT_NOT_RESOLVED"));
        return;
    }
    next();
};

export default requireTenant;

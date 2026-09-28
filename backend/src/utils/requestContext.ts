import { Request } from "express";
import { Types } from "mongoose";
import { IUser } from "../interfaces/IUser.js";
import { AppError } from "./AppError.js";

/**
 * Who is acting, for which tenant, on which request. Controllers build it once with
 * `requestContext(req)` and pass it to services; services pass `ctx.tenantId` to repositories.
 * See docs/backend-architecture.md §5.
 */
export interface RequestContext {
    tenantId: Types.ObjectId;
    userId: Types.ObjectId;
    user: IUser;
    requestId: string;
}

/** Builds the context for a request that has passed `protect`. Fails closed if tenant or user is missing. */
export const requestContext = (req: Request): RequestContext => {
    if (!req.user?._id) {
        throw new AppError("Not authorized", 401, "AUTH_REQUIRED");
    }
    if (!req.tenantId) {
        throw new AppError("No tenant is linked to this account", 403, "TENANT_REQUIRED");
    }
    return {
        tenantId: new Types.ObjectId(String(req.tenantId)),
        userId: new Types.ObjectId(String(req.user._id)),
        user: req.user,
        requestId: req.id ?? "",
    };
};

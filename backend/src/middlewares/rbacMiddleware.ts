import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

type Permission = "delete:item" | "delete:customer" | "delete:supplier" | "delete:expense" | "delete:invoice" | "delete:return" | "delete:salesorder" | "manage:users";

export const requirePermission = (permission: Permission) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        // Owner has all permissions by default
        if (user && user.role === 'owner') {
            return next();
        }

        // Logic for other roles can optionally go here

        next(new AppError("You do not have permission to perform this action", 403));
    };
};

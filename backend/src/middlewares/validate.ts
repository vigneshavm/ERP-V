import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../utils/AppError.js";

/**
 * Runs after one or more express-validator chains on a route. On failure it hands a 400
 * VALIDATION_ERROR (message = first failure, details = all failures) to the central errorHandler.
 */
export const validate = (req: Request, _res: Response, next: NextFunction): void => {
    const result = validationResult(req);
    if (result.isEmpty()) {
        next();
        return;
    }
    const details = result.array().map((e: any) => ({ field: e.path ?? e.param, message: e.msg, location: e.location }));
    next(new AppError(String(details[0].message), 400, "VALIDATION_ERROR", details));
};

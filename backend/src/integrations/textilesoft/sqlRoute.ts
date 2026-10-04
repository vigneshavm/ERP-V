import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import { SqlWriteError } from "./sqlWrite.js";

/** Express handler for SQL-backed endpoints: SqlWriteError -> AppError (its status + message). */
export const sqlRoute = (
  fn: (req: Request, res: Response) => Promise<unknown>,
) =>
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof SqlWriteError)
        return next(new AppError(err.message, err.statusCode, err.code));
      throw err;
    }
  });

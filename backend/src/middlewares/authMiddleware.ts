import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { warn } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";
import type { Types } from "mongoose";
import { IUser } from "../interfaces/IUser.js";
import {
  getSqlUser,
  toErpUser,
  tokenMatchesPassword,
  SqlAuthError,
} from "../integrations/textilesoft/sqlAuth.js";

/**
 * Properly-typed authenticated request with guaranteed tenantId and user
 * Controllers should cast to this after the protect middleware
 */
declare global {
  namespace Express {
    interface Request {
      /** Set by `protect`. Typed as always present so handlers behind `protect` can use it directly;
       *  routes without `protect` must not read it. */
      user: IUser;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: IUser;
  tenantId: Types.ObjectId;
}

/**
 * Middleware to protect routes. Every session is a stateless JWT issued against a Textilesoft
 * (dbo.newuser) login -- see integrations/textilesoft/sqlAuth.ts. The user is re-read from SQL on
 * every request (short-lived cache), so a password/rights change in Textilesoft takes effect within
 * about a minute without any server-side session/device store.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

      if (decoded.src !== "sql") {
        return res.status(401).json({
          message: "Please log in again with your Textilesoft user ID.",
          sessionExpired: true,
          reason: "auth_source_changed",
        });
      }

      const sqlUser = await getSqlUser(Number(decoded.sqlUserId));
      if (!sqlUser) {
        throw new AppError(
          "Not authorized, user not found",
          401,
          "AUTH_USER_NOT_FOUND",
        );
      }
      // Password changed in Textilesoft since this token was issued -> end the session.
      if (!tokenMatchesPassword(decoded.pwv, sqlUser)) {
        return res.status(401).json({
          message: "Your password was changed. Please log in again.",
          sessionExpired: true,
          reason: "credentials_changed",
        });
      }
      // Role comes from the freshly read row (not the token), so a rights change applies within a minute.
      const authReq = req as unknown as AuthenticatedRequest;
      authReq.user = toErpUser(sqlUser) as unknown as IUser;
      authReq.tenantId = authReq.user.tenantId as Types.ObjectId;
      next();
    } else {
      throw new AppError(
        "Not authorized, token missing",
        401,
        "AUTH_TOKEN_MISSING",
      );
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    if (error instanceof SqlAuthError) {
      next(new AppError(error.message, error.statusCode, error.code));
      return;
    }
    warn("⚠️  [AUTH] Protection middleware failure", {
      error: error.message,
      token: token
        ? "present (truncated: " + token.substring(0, 10) + "...)"
        : "missing",
    });
    next(
      new AppError("Not authorized, token failed", 401, "AUTH_TOKEN_INVALID"),
    );
  }
};

/**
 * Middleware for role-based authorization
 * Must be used after protect middleware
 * @param roles - Array of allowed roles (e.g., ['admin', 'super_admin'])
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new AppError("Not authorized, user not found", 401));
    }

    const userRole = (
      (user as IUser & { systemRole?: string }).systemRole ||
      user.role ||
      ""
    ).toLowerCase();

    if (!roles.includes(userRole)) {
      return next(
        new AppError(
          `Role '${userRole}' is not authorized to access this resource`,
          403,
        ),
      );
    }

    next();
  };
};

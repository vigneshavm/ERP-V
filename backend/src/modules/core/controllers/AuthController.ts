import { Request, Response } from "express";
import { singleton } from "tsyringe";
import { info, warn } from "../../../config/logger.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import {
  verifySqlLogin,
  generateSqlToken,
  getSqlUser,
  toErpUser,
  SqlAuthError,
} from "../../../integrations/textilesoft/sqlAuth.js";
import {
  issueRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
} from "../../../integrations/textilesoft/erpRefreshToken.js";

/** Users, passwords and activation are managed in Textilesoft (dbo.newuser), not by this API. */
const TEXTILESOFT_MANAGED = {
  message:
    "Users and passwords are managed in Textilesoft. Ask the shop admin to create or reset your login there.",
  code: "AUTH_MANAGED_IN_TEXTILESOFT",
};

@singleton()
export class AuthController {
  /** Account creation happens in Textilesoft (newuser.aspx), not through this API. */
  public register = async (_req: Request, res: Response): Promise<void> => {
    res.status(403).json(TEXTILESOFT_MANAGED);
  };

  /**
   * Login with a Textilesoft user (dbo.newuser in the shop SQL database) -- see integrations/textilesoft/sqlAuth.ts.
   * Body: { username, password } (`email` is accepted as the user ID too, for older clients).
   * Issues a stateless access token plus a rotating refresh token stored (hashed) in erp.refresh_token.
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    const { handleLoginAttempt } = await import(
      "../../../middlewares/rateLimiter.js"
    );
    const username = String(
      req.body?.username ?? req.body?.email ?? "",
    ).trim();
    const password = String(req.body?.password ?? "");
    try {
      const sqlUser = await verifySqlLogin(username, password);
      const user = toErpUser(sqlUser);
      await handleLoginAttempt(req, true);
      // The refresh token lives in erp.refresh_token. If that table has not been created yet
      // (npm run erp:migrate), sign in anyway: the user just has to log in again when the access token expires.
      let refresh: { token: string } | null = null;
      try {
        refresh = await issueRefreshToken(
          sqlUser.sqlUserId,
          req.ip,
          req.headers["user-agent"],
        );
      } catch (e) {
        warn("[LOGIN] refresh token not issued (run `npm run erp:migrate`)", {
          error: (e as Error).message,
        });
      }
      info("[LOGIN] Textilesoft user logged in", {
        userId: sqlUser.userId,
        role: sqlUser.role,
        ip: req.ip,
      });
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        shopName: user.shopName,
        role: user.role,
        tenantId: user.tenantId,
        counterName: user.counterName,
        authSource: "sql",
        token: generateSqlToken(sqlUser),
        refreshToken: refresh?.token,
      });
    } catch (err) {
      if (err instanceof SqlAuthError) {
        if ([400, 401, 403].includes(err.statusCode)) {
          await handleLoginAttempt(req, false);
        }
        res
          .status(err.statusCode)
          .json({ message: err.message, code: err.code });
        return;
      }
      throw err;
    }
  };

  /** Exchanges a refresh token (erp.refresh_token) for a new access token, without re-entering a password. */
  public refresh = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = String(req.body?.refreshToken ?? "");
    if (!refreshToken) {
      res.status(400).json({ message: "refreshToken is required" });
      return;
    }
    const sqlUserId = await verifyRefreshToken(refreshToken);
    if (!sqlUserId) {
      res.status(401).json({
        message: "Refresh token is invalid or expired",
        code: "AUTH_REFRESH_INVALID",
      });
      return;
    }
    const sqlUser = await getSqlUser(sqlUserId);
    if (!sqlUser) {
      res
        .status(401)
        .json({ message: "User not found", code: "AUTH_USER_NOT_FOUND" });
      return;
    }
    // Rotate: the old refresh token is single-use.
    await revokeRefreshToken(refreshToken);
    const nextRefresh = await issueRefreshToken(
      sqlUser.sqlUserId,
      req.ip,
      req.headers["user-agent"],
    );
    res.status(200).json({
      token: generateSqlToken(sqlUser),
      refreshToken: nextRefresh.token,
    });
  };

  /** Revokes one refresh token (this device only). */
  public logout = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = String(req.body?.refreshToken ?? "");
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.status(200).json({ message: "Logged out" });
  };

  /** Profile is built entirely from the SQL row by `protect`; there is no separate user record to fetch. */
  public getProfile = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    res.status(200).json(req.user);
  };

  /** Revokes every refresh token for this Textilesoft user (logs it out on every device). */
  public forceLogout = async (req: Request, res: Response): Promise<void> => {
    const username = String(
      req.body?.username ?? req.body?.email ?? "",
    ).trim();
    const password = String(req.body?.password ?? "");
    try {
      const sqlUser = await verifySqlLogin(username, password);
      await revokeAllRefreshTokens(sqlUser.sqlUserId);
      res.status(200).json({ message: "All sessions revoked successfully." });
    } catch (err) {
      if (err instanceof SqlAuthError) {
        res
          .status(err.statusCode)
          .json({ message: err.message, code: err.code });
        return;
      }
      throw err;
    }
  };

  public forgotPassword = async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    res.status(403).json(TEXTILESOFT_MANAGED);
  };

  public resetPassword = async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    res.status(403).json(TEXTILESOFT_MANAGED);
  };
}

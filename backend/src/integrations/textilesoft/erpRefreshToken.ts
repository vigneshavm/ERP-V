/**
 * Refresh tokens for Textilesoft-backed logins (erp.refresh_token -- see LEGACYTOMODERN_SQL_ONLY_STRATEGY.md
 * section 7.3). Only a SHA-256 hash of the token is stored; the raw token exists only in the response body
 * and the client's storage. `user_id` is the Textilesoft dbo.newuser.NewUser_ID (same key sqlAuth uses).
 */
import crypto from "crypto";
import { query, tx } from "./erpDb.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const hash = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

/** Issues a new refresh token for a Textilesoft user and stores its hash. */
export async function issueRefreshToken(
  sqlUserId: number,
  createdByIp?: string,
  userAgent?: string,
): Promise<IssuedRefreshToken> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await query(
    `INSERT INTO erp.refresh_token (user_id, token_hash, expires_at, created_by_ip, user_agent)
     VALUES (@userId, @tokenHash, @expiresAt, @ip, @ua)`,
    {
      userId: String(sqlUserId),
      tokenHash: hash(token),
      expiresAt,
      ip: createdByIp ?? null,
      ua: userAgent ?? null,
    },
  );
  return { token, expiresAt };
}

/** Returns the Textilesoft sqlUserId the token belongs to, or null if unknown/expired/revoked. */
export async function verifyRefreshToken(token: string): Promise<number | null> {
  const rows = await query(
    `SELECT TOP 1 user_id FROM erp.refresh_token
     WHERE token_hash = @tokenHash AND revoked_at IS NULL AND expires_at > SYSUTCDATETIME()`,
    { tokenHash: hash(token) },
  );
  if (!rows.length) return null;
  const userId = Number(rows[0].user_id);
  return Number.isFinite(userId) ? userId : null;
}

/** Revokes one refresh token (used on rotation/logout). */
export async function revokeRefreshToken(token: string): Promise<void> {
  await query(
    `UPDATE erp.refresh_token SET revoked_at = SYSUTCDATETIME()
     WHERE token_hash = @tokenHash AND revoked_at IS NULL`,
    { tokenHash: hash(token) },
  );
}

/** Revokes every active refresh token for a user (force-logout from all devices). */
export async function revokeAllRefreshTokens(sqlUserId: number): Promise<void> {
  await tx("revoke all refresh tokens", (t) =>
    t.query(
      `UPDATE erp.refresh_token SET revoked_at = SYSUTCDATETIME()
       WHERE user_id = @userId AND revoked_at IS NULL`,
      { userId: String(sqlUserId) },
    ),
  );
}

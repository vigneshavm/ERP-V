import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";
import { SqlWriteError } from "../../../integrations/textilesoft/sqlWrite.js";
import {
  setUserDiscountLimit,
  renameSqlUser,
} from "../../../integrations/textilesoft/sqlUserAdmin.js";
import { listSqlUsers } from "../../../integrations/textilesoft/sqlAuth.js";

const DISCOUNT_ADMIN_ROLES = ["owner", "co-owner", "manager"];

/** ERP id of a Textilesoft user ("ffffffff" + 16 hex digits of dbo.newuser.NewUser_ID) -> NewUser_ID. */
function sqlUserIdFrom(id: string): number {
  if (!/^ffffffff[0-9a-f]{16}$/i.test(id))
    throw new SqlWriteError("User not found.", 404);
  return parseInt(id.slice(8), 16);
}

export const getUsers = sql(async (_req, res) => {
  res.json(await listSqlUsers());
});

export const patchDiscountLimit = sql(async (req, res: Response) => {
  const r = req as AuthenticatedRequest;
  if (!r.user?.role || !DISCOUNT_ADMIN_ROLES.includes(r.user.role))
    throw new SqlWriteError(
      "Only an owner, co-owner, or manager can set a discount limit.",
      403,
    );
  const raw = req.body?.maxDiscountPercent;
  if (raw === null || raw === undefined || raw === "")
    throw new SqlWriteError(
      "Enter a number from 0 to 100. Textilesoft has no \"use shop default\" setting; 0 means no bill discount.",
      400,
    );
  const percent = Number(raw);
  if (Number.isNaN(percent) || percent < 0 || percent > 100)
    throw new SqlWriteError(
      "maxDiscountPercent must be a number between 0 and 100.",
      400,
    );
  await setUserDiscountLimit(sqlUserIdFrom(String(req.params.id)), percent);
  const user = (await listSqlUsers()).find((u) => u._id === String(req.params.id));
  res.json({ message: "Discount limit updated", user });
});

/** Own profile only. Textilesoft's user table stores just the display name; other fields can't be saved. */
export const putUser = sql(async (req, res) => {
  const r = req as AuthenticatedRequest;
  if (String(r.user?._id) !== String(req.params.id))
    throw new SqlWriteError(
      "Unauthorized: Cannot update other users' profiles",
      403,
    );
  const body = (req.body ?? {}) as Record<string, unknown>;
  const unsupported = Object.keys(body).filter(
    (k) => k !== "name" && body[k] !== undefined,
  );
  if (unsupported.length)
    throw new SqlWriteError(
      `Textilesoft's user table only stores the name; these were not saved: ${unsupported.join(", ")}.`,
      400,
    );
  if (body.name === undefined)
    throw new SqlWriteError("Nothing to update.", 400);
  await renameSqlUser(sqlUserIdFrom(String(req.params.id)), String(body.name));
  const user = (await listSqlUsers()).find((u) => u._id === String(req.params.id));
  res.json({ success: true, user });
});

import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import { legacyMissingSales, legacyGrnDetails, legacySalesmen, legacyNativeCapabilities } from "../../../integrations/textilesoft/sqlLegacyQueries.js";

export const getLegacyMissingSales = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { const r = await legacyMissingSales(req.query); res.json({ success: true, data: r.rows, items: r.rows, pagination: r.pagination }); } catch (error) { next(error); }
};
export const getLegacyRcGrn = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await legacyGrnDetails("rc", String(req.params.id)) }); } catch (error) { next(error); }
};
export const getLegacyReferenceGrn = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await legacyGrnDetails("reference", String(req.params.id)) }); } catch (error) { next(error); }
};
export const getLegacySalesmen = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await legacySalesmen() }); } catch (error) { next(error); }
};

export const getLegacyNativeCapabilities = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await legacyNativeCapabilities() }); } catch (error) { next(error); }
};

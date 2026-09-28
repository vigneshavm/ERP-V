import { Request, Response } from "express";
import { error } from "../../../config/logger.js";
import { parseFinanceRange } from "../../finance/services/FinanceReportService.js";
import { buildLoyaltyReport, buildMarketingMetrics, buildWhatsAppCampaignsReport } from "../../crm/services/EngagementReportService.js";

/**
 * Customer-engagement pages (whole shop, ERP records only):
 *   GET /api/reports/engagement/loyalty?from&to
 *   GET /api/reports/engagement/whatsapp-campaigns?from&to
 *   GET /api/reports/engagement/marketing?from&to
 * A failure is an error response, never sample data.
 */

const tenantOf = (req: Request): string => String((req as unknown as { tenantId?: string }).tenantId ?? "");
const q = (req: Request, k: string) => (typeof req.query[k] === "string" ? (req.query[k] as string) : undefined);

function handler(label: string, fn: (tenantId: string, range: { from: string; to: string }) => Promise<unknown>) {
    return async (req: Request, res: Response): Promise<void> => {
        const range = parseFinanceRange(q(req, "from"), q(req, "to"));
        if (!range) {
            res.status(400).json({ message: "Pass from and to as YYYY-MM-DD, with from on or before to." });
            return;
        }
        try {
            res.status(200).json(await fn(tenantOf(req), range));
        } catch (err) {
            error(`${label} Error: ${(err as Error).message}`);
            res.status(500).json({ message: `Unable to load ${label}`, error: (err as Error).message });
        }
    };
}

export const getLoyaltyReport = handler("Loyalty", buildLoyaltyReport);
export const getWhatsAppCampaignsReport = handler("WhatsApp campaigns", buildWhatsAppCampaignsReport);
export const getMarketingMetrics = handler("Marketing metrics", buildMarketingMetrics);

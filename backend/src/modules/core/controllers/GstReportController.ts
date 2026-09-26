import { Request, Response } from "express";
import { error } from "../../../config/logger.js";
import { buildGstr1, buildGstr3b, buildGstr9, buildPurchaseRegister, parseRange } from "../../finance/services/GstReturnService.js";

/**
 * GST return reports (Reports > GST Reports). Shop-database figures are included when ITEM_DATA_SOURCE=sql;
 * the ERP's own invoices and supplier bills always are. See GstReturnService for the rules.
 *
 *   GET /api/reports/gst/gstr1?from&to
 *   GET /api/reports/gst/gstr3b?from&to
 *   GET /api/reports/gst/gstr9?fy=2025        (financial year starting 1 April 2025)
 *   GET /api/reports/gst/purchase-register?from&to&search&sort&dir&page&limit&eligibility=eligible|no-gstin&source=shop|erp
 */

const q = (req: Request, k: string): string | undefined => (typeof req.query[k] === "string" ? (req.query[k] as string) : undefined);
const tenantOf = (req: Request): string => String((req as unknown as { tenantId?: string }).tenantId ?? "");

function handler(label: string, fn: (req: Request, tenantId: string) => Promise<unknown>) {
    return async (req: Request, res: Response): Promise<void> => {
        try {
            res.status(200).json(await fn(req, tenantOf(req)));
        } catch (err) {
            if (err instanceof BadRequest) {
                res.status(400).json({ message: err.message });
                return;
            }
            error(`${label} Error: ${(err as Error).message}`);
            res.status(500).json({ message: `Unable to load ${label}`, error: (err as Error).message });
        }
    };
}

class BadRequest extends Error {}

function rangeOf(req: Request) {
    const range = parseRange(q(req, "from"), q(req, "to"));
    if (!range) throw new BadRequest("Pass from and to as YYYY-MM-DD, with from on or before to.");
    return range;
}

export const getGstr1 = handler("GSTR-1", (req, tenantId) => buildGstr1(tenantId, rangeOf(req)));

export const getGstr3b = handler("GSTR-3B", (req, tenantId) => buildGstr3b(tenantId, rangeOf(req)));

export const getGstr9 = handler("GSTR-9", (req, tenantId) => {
    const fy = Number(q(req, "fy"));
    if (!Number.isInteger(fy) || fy < 2017 || fy > 2100) throw new BadRequest("Pass fy as the year the financial year starts, e.g. fy=2025 for 2025-26.");
    return buildGstr9(tenantId, fy);
});

export const getPurchaseGstRegister = handler("Purchase GST Register", (req, tenantId) =>
    buildPurchaseRegister(tenantId, rangeOf(req), {
        search: q(req, "search"), sort: q(req, "sort"), dir: q(req, "dir"), page: q(req, "page"), limit: q(req, "limit"),
        eligibility: q(req, "eligibility"), source: q(req, "source"),
    }),
);

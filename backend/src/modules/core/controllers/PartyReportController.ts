import { Request, Response } from "express";
import { error } from "../../../config/logger.js";
import { isSqlItemSource } from "../../../config/itemDataSource.js";
import { sqlAllParties, sqlPartyItems, sqlPartyPnl, sqlPartyStatement, sqlPurchaseByParty, sqlPurchaseByPartyGroup, sqlSalesByParty, sqlSalesByPartyGroup, type SalesPartyQuery } from "../../../integrations/textilesoft/sqlPartyReports.js";

/**
 * Party reports (Reports > Party Reports), read from the shop database. They need ITEM_DATA_SOURCE=sql: there is no
 * MongoDB equivalent yet, so in Mongo mode they answer 501 with a clear message instead of made-up figures.
 */

const str = (req: Request, k: string): string | undefined => (typeof req.query[k] === "string" ? (req.query[k] as string) : undefined);

function partyQuery(req: Request): SalesPartyQuery & { key?: string } {
    return {
        from: str(req, "from"), to: str(req, "to"), type: str(req, "type"), group: str(req, "group"), key: str(req, "key"), search: str(req, "search"),
        sort: str(req, "sort"), dir: str(req, "dir"), page: str(req, "page"), limit: str(req, "limit"), refresh: str(req, "refresh"),
    };
}

function handler(label: string, fn: (q: SalesPartyQuery & { key?: string }, tenantId: string) => Promise<unknown>) {
    return async (req: Request, res: Response): Promise<void> => {
        if (!isSqlItemSource()) {
            res.status(501).json({ message: `${label} reads the shop database. Set ITEM_DATA_SOURCE=sql to use it.` });
            return;
        }
        try {
            res.status(200).json(await fn(partyQuery(req), String((req as any).tenantId)));
        } catch (err: any) {
            error(`${label} Error: ${err.message}`);
            res.status(500).json({ message: `Unable to load ${label.toLowerCase()}`, error: err.message });
        }
    };
}

export const getPurchaseByParty = handler("Purchase by Party", sqlPurchaseByParty);
export const getAllParties = handler("All Parties", sqlAllParties);
export const getSalesByParty = handler("Sales by Party", sqlSalesByParty);
export const getSalesByPartyGroup = handler("Sales by Party Group", sqlSalesByPartyGroup);
export const getPartyItems = handler("Party Report by Item", sqlPartyItems);
export const getPartyPnl = handler("Party-Wise Profit & Loss", sqlPartyPnl);
export const getPartyStatement = handler("Party Statement", sqlPartyStatement);
export const getPurchaseByPartyGroup = handler("Purchase by Party Group", sqlPurchaseByPartyGroup);

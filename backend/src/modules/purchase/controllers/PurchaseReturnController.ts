import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "tsyringe";
import { PurchaseReturnService, CreatePurchaseReturnInput } from "../services/PurchaseReturnService.js";
import { requestContext } from "../../../utils/requestContext.js";
import { sendCreated, sendList, sendSuccess } from "../../../utils/apiResponse.js";

/** HTTP translation only (docs/backend-architecture.md §2). Business rules live in PurchaseReturnService. */
@injectable()
export class PurchaseReturnController {
    constructor(
        @inject(PurchaseReturnService) private purchaseReturnService: PurchaseReturnService,
    ) { }

    /** POST /api/purchase-returns */
    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const purchaseReturn = await this.purchaseReturnService.createPurchaseReturn(
                requestContext(req),
                req.body as CreatePurchaseReturnInput,
            );
            sendCreated(res, purchaseReturn, "Purchase return created");
        } catch (error) {
            next(error);
        }
    };

    /** GET /api/purchase-returns */
    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            sendList(res, await this.purchaseReturnService.listPurchaseReturns(requestContext(req)));
        } catch (error) {
            next(error);
        }
    };

    /** GET /api/purchase-returns/:id */
    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            sendSuccess(res, await this.purchaseReturnService.getPurchaseReturn(requestContext(req), String(req.params.id)));
        } catch (error) {
            next(error);
        }
    };

    /** DELETE /api/purchase-returns/:id */
    remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.purchaseReturnService.deletePurchaseReturn(requestContext(req), String(req.params.id));
            sendSuccess(res, null, { message: "Purchase return deleted" });
        } catch (error) {
            next(error);
        }
    };
}

import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "tsyringe";
import { GRNTransferService, CreateGRNTransferInput } from "../services/GRNTransferService.js";
import { requestContext } from "../../../utils/requestContext.js";
import { sendCreated, sendList, sendSuccess } from "../../../utils/apiResponse.js";

/** HTTP translation only. Business rules live in GRNTransferService. */
@injectable()
export class GRNTransferController {
    constructor(@inject(GRNTransferService) private grnTransferService: GRNTransferService) { }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const transfer = await this.grnTransferService.createTransfer(requestContext(req), req.body as CreateGRNTransferInput);
            sendCreated(res, transfer, "Material transferred");
        } catch (error) {
            next(error);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const sourceGrnId = typeof req.query.sourceGrnId === "string" ? req.query.sourceGrnId : undefined;
            sendList(res, await this.grnTransferService.listTransfers(requestContext(req), { sourceGrnId }));
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            sendSuccess(res, await this.grnTransferService.getTransfer(requestContext(req), String(req.params.id)));
        } catch (error) {
            next(error);
        }
    };
}

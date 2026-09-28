import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "tsyringe";
import { RateRevisionService, CreateRateRevisionInput } from "../services/RateRevisionService.js";
import { requestContext } from "../../../utils/requestContext.js";
import { sendCreated, sendList, sendSuccess } from "../../../utils/apiResponse.js";

/** HTTP translation only. Business rules live in RateRevisionService. */
@injectable()
export class RateRevisionController {
    constructor(@inject(RateRevisionService) private rateRevisionService: RateRevisionService) { }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const revision = await this.rateRevisionService.createRevision(requestContext(req), req.body as CreateRateRevisionInput);
            sendCreated(res, revision, "Rate revision request created");
        } catch (error) {
            next(error);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            sendList(res, await this.rateRevisionService.listRevisions(requestContext(req)));
        } catch (error) {
            next(error);
        }
    };

    approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const revision = await this.rateRevisionService.approveRevision(requestContext(req), String(req.params.id));
            sendSuccess(res, revision, { message: "Revision approved: supplier balance increased and batch cost updated" });
        } catch (error) {
            next(error);
        }
    };

    reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const revision = await this.rateRevisionService.rejectRevision(requestContext(req), String(req.params.id));
            sendSuccess(res, revision, { message: "Revision rejected" });
        } catch (error) {
            next(error);
        }
    };
}

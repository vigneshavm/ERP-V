import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "tsyringe";
import { DebitNoteService, CreateDebitNoteInput, DebitNoteStatus } from "../services/DebitNoteService.js";
import { requestContext } from "../../../utils/requestContext.js";
import { sendCreated, sendList, sendSuccess } from "../../../utils/apiResponse.js";

/** HTTP translation only. Business rules live in DebitNoteService. */
@injectable()
export class DebitNoteController {
    constructor(@inject(DebitNoteService) private debitNoteService: DebitNoteService) { }

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            sendList(res, await this.debitNoteService.listDebitNotes(requestContext(req)));
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            sendSuccess(res, await this.debitNoteService.getDebitNote(requestContext(req), String(req.params.id)));
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const note = await this.debitNoteService.createDebitNote(requestContext(req), req.body as CreateDebitNoteInput);
            sendCreated(res, note, "Debit note created");
        } catch (error) {
            next(error);
        }
    };

    changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const note = await this.debitNoteService.changeStatus(requestContext(req), String(req.params.id), req.body.status as DebitNoteStatus);
            sendSuccess(res, note, { message: `Debit note ${note.status.toLowerCase()}` });
        } catch (error) {
            next(error);
        }
    };

    remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.debitNoteService.deleteDebitNote(requestContext(req), String(req.params.id));
            sendSuccess(res, null, { message: "Debit note deleted" });
        } catch (error) {
            next(error);
        }
    };
}

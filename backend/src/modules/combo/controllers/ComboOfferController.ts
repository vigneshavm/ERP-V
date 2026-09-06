import { Request, Response } from "express";
import { singleton, inject } from "tsyringe";
import { ComboOfferService } from "../services/ComboOfferService.js";
import { error } from "../../../config/logger.js";

@singleton()
export class ComboOfferController {
    constructor(
        @inject(ComboOfferService) private comboOfferService: ComboOfferService
    ) { }

    public createComboOffer = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const result = await this.comboOfferService.createComboOffer(authReq.body, authReq.tenantId, authReq.user._id);
            res.status(201).json(result);
        } catch (err: any) {
            error(`Create Combo Offer Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public getAllComboOffers = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const result = await this.comboOfferService.getAllComboOffers(authReq.tenantId, req.query);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Get All Combo Offers Error: ${err.message}`);
            res.status(500).json({ message: "Server Error", error: err.message });
        }
    };

    public getComboOfferById = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const result = await this.comboOfferService.getComboOfferById(authReq.params.id, authReq.tenantId);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Get Combo Offer Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public updateComboOffer = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const result = await this.comboOfferService.updateComboOffer(authReq.params.id, authReq.tenantId, authReq.body);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Update Combo Offer Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public deleteComboOffer = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            await this.comboOfferService.deleteComboOffer(authReq.params.id, authReq.tenantId);
            res.status(200).json({ message: "Combo offer deleted" });
        } catch (err: any) {
            error(`Delete Combo Offer Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
}

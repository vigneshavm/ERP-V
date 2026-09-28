import { Response } from "express";
import { singleton, inject } from "tsyringe";
import { ComboOfferService } from "../services/ComboOfferService.js";
import { error } from "../../../config/logger.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";

@singleton()
export class ComboOfferController {
    constructor(
        @inject(ComboOfferService) private comboOfferService: ComboOfferService
    ) { }

    public createComboOffer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const result = await this.comboOfferService.createComboOffer(req.body, req.tenantId.toString(), req.user._id.toString());
            res.status(201).json(result);
        } catch (err: any) {
            error(`Create Combo Offer Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public getAllComboOffers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const result = await this.comboOfferService.getAllComboOffers(req.tenantId.toString(), req.query);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Get All Combo Offers Error: ${err.message}`);
            res.status(500).json({ message: "Server Error", error: err.message });
        }
    };

    public getComboOfferById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const result = await this.comboOfferService.getComboOfferById(String(req.params.id), req.tenantId.toString());
            res.status(200).json(result);
        } catch (err: any) {
            error(`Get Combo Offer Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public updateComboOffer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const result = await this.comboOfferService.updateComboOffer(String(req.params.id), req.tenantId.toString(), req.body);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Update Combo Offer Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public deleteComboOffer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            await this.comboOfferService.deleteComboOffer(String(req.params.id), req.tenantId.toString());
            res.status(200).json({ message: "Combo offer deleted" });
        } catch (err: any) {
            error(`Delete Combo Offer Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
}


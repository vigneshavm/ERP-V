import { Request, Response, NextFunction } from "express";
import { autoInjectable } from "tsyringe";
import { SupplierService } from "../services/SupplierService.js";

@autoInjectable()
export class SupplierController {
    constructor(private supplierService: SupplierService) { }

    addSupplier = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            const result = await this.supplierService.addSupplier(req.body, userId, userName);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    getAllSuppliers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const suppliers = await this.supplierService.getAllSuppliers(userId);
            res.status(200).json(suppliers);
        } catch (error) {
            next(error);
        }
    }

    getSupplierById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const supplier = await this.supplierService.getSupplierById(req.params.id as string, userId);
            res.status(200).json(supplier);
        } catch (error) {
            next(error);
        }
    }

    updateSupplier = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            const result = await this.supplierService.updateSupplier(req.params.id as string, userId, req.body, userName);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            await this.supplierService.deleteSupplier(req.params.id as string, userId, userName);
            res.status(200).json({ message: "Supplier deleted" });
        } catch (error) {
            next(error);
        }
    }
}

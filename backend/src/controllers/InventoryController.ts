import { Request, Response, NextFunction } from "express";
import { autoInjectable } from "tsyringe";
import { InventoryService } from "../services/InventoryService.js";

@autoInjectable()
export class InventoryController {
    constructor(private inventoryService: InventoryService) { }

    addItem = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;

            const result = await this.inventoryService.addItem(req.body, userId, userName);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    getAllItems = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const items = await this.inventoryService.getAllItems(userId);
            res.status(200).json(items);
        } catch (error) {
            next(error);
        }
    }

    getSingleItem = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const item = await this.inventoryService.getSingleItem(req.params.id as string, userId);
            res.status(200).json(item);
        } catch (error) {
            next(error);
        }
    }

    updateItem = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            // req.originalEntity and req.updatedEntity logic can be handled or middleware can do it.
            // Middleware attached in route will handle audit logging based on response or logic.
            // But existing audit middleware might rely on req properties.
            // We'll proceed with service call.

            const result = await this.inventoryService.updateItem(req.params.id as string, userId, req.body, userName);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    deleteItem = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            await this.inventoryService.deleteItem(req.params.id as string, userId, userName);
            res.status(200).json({ message: "Item deleted" });
        } catch (error) {
            next(error);
        }
    }

    getLowStockItems = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const items = await this.inventoryService.getLowStockItems(userId);
            res.status(200).json(items);
        } catch (error) {
            next(error);
        }
    }

    importItems = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { items } = req.body;
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;

            const result = await this.inventoryService.importItems(items, userId, userName);
            res.status(200).json({
                message: `Import completed: ${result.imported} items created, ${result.updated} items updated, ${result.skipped} skipped`,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }
}

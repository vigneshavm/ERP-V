import { Request, Response, NextFunction } from "express";
import { autoInjectable } from "tsyringe";
import { CustomerService } from "../services/CustomerService.js";

@autoInjectable()
export class CustomerController {
    constructor(private customerService: CustomerService) { }

    addCustomer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            const result = await this.customerService.addCustomer(req.body, userId, userName);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const customers = await this.customerService.getAllCustomers(userId);
            res.status(200).json(customers);
        } catch (error) {
            next(error);
        }
    }

    getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const customer = await this.customerService.getCustomerById(req.params.id as string, userId);
            res.status(200).json(customer);
        } catch (error) {
            next(error);
        }
    }

    updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            const result = await this.customerService.updateCustomer(req.params.id as string, userId, req.body, userName);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            await this.customerService.deleteCustomer(req.params.id as string, userId, userName);
            res.status(200).json({ message: "Customer deleted" });
        } catch (error) {
            next(error);
        }
    }

    getCustomerTransactions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const result = await this.customerService.getCustomerTransactions(req.params.id as string, userId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

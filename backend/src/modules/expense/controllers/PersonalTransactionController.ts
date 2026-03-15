import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { PersonalTransactionService } from '../services/PersonalTransactionService.js';
import { error } from '../../../config/logger.js';

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        [key: string]: any;
    };
}

export class PersonalTransactionController {
    private service: PersonalTransactionService;

    constructor() {
        this.service = container.resolve(PersonalTransactionService);
    }

    getAll = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const transactions = await this.service.getAllTransactions(req.user?._id as string);
            res.json(transactions);
        } catch (err) {
            error(`Get all personal transactions failed: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const transaction = await this.service.createTransaction(req.body, req.user?._id as string);
            res.status(201).json(transaction);
        } catch (err: any) {
            error(`Create personal transaction failed: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const transaction = await this.service.updateTransaction(req.params.id, req.user?._id as string, req.body);
            res.json(transaction);
        } catch (err: any) {
            error(`Update personal transaction failed: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            await this.service.deleteTransaction(req.params.id, req.user?._id as string);
            res.json({ message: 'Transaction deleted successfully' });
        } catch (err: any) {
            error(`Delete personal transaction failed: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
}

export default new PersonalTransactionController();

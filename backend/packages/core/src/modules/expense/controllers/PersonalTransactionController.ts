import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { PersonalTransactionService } from '../services/PersonalTransactionService.js';
import { error } from '@smarterp/shared/config/logger.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

export class PersonalTransactionController {
    private service: PersonalTransactionService;

    constructor() {
        this.service = container.resolve(PersonalTransactionService);
    }

    getAll = async (req: AuthenticatedRequest, res: Response) => {
        const transactions = await this.service.getAllTransactions(req.user!._id as string);
        res.json(transactions);

    create = async (req: AuthenticatedRequest, res: Response) => {
        const transaction = await this.service.createTransaction(req.body, req.user!._id as string);
        res.status(201).json(transaction);

    update = async (req: AuthenticatedRequest, res: Response) => {
        const transaction = await this.service.updateTransaction(req.params.id, req.user!._id as string, req.body);
        res.json(transaction);

    delete = async (req: AuthenticatedRequest, res: Response) => {
        await this.service.deleteTransaction(req.params.id, req.user!._id as string);
        res.json({ message: 'Transaction deleted successfully' });
}

export default new PersonalTransactionController();

import { container } from 'tsyringe';
import { PersonalTransactionService } from '../services/PersonalTransactionService.js';
import { error } from '@smarterp/shared/config/logger.js';
export class PersonalTransactionController {
    service;
    constructor() {
        this.service = container.resolve(PersonalTransactionService);
    }
    getAll = async (req, res) => {
        try {
            const transactions = await this.service.getAllTransactions(req.user?._id);
            res.json(transactions);
        }
        catch (err) {
            error(`Get all personal transactions failed: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    create = async (req, res) => {
        try {
            const transaction = await this.service.createTransaction(req.body, req.user?._id);
            res.status(201).json(transaction);
        }
        catch (err) {
            error(`Create personal transaction failed: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
    update = async (req, res) => {
        try {
            const transaction = await this.service.updateTransaction(req.params.id, req.user?._id, req.body);
            res.json(transaction);
        }
        catch (err) {
            error(`Update personal transaction failed: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
    delete = async (req, res) => {
        try {
            await this.service.deleteTransaction(req.params.id, req.user?._id);
            res.json({ message: 'Transaction deleted successfully' });
        }
        catch (err) {
            error(`Delete personal transaction failed: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
}
export default new PersonalTransactionController();

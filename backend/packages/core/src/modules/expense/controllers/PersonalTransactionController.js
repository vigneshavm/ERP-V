import { container } from 'tsyringe';
import { PersonalTransactionService } from '../services/PersonalTransactionService.js';
export class PersonalTransactionController {
    service;
    constructor() {
        this.service = container.resolve(PersonalTransactionService);
    }
    getAll = async (req, res) => {
        const transactions = await this.service.getAllTransactions(req.user._id);
        res.json(transactions);
    };
    create = async (req, res) => {
        const transaction = await this.service.createTransaction(req.body, req.user._id);
        res.status(201).json(transaction);
    };
    update = async (req, res) => {
        const transaction = await this.service.updateTransaction(req.params.id, req.user._id, req.body);
        res.json(transaction);
    };
    delete = async (req, res) => {
        await this.service.deleteTransaction(req.params.id, req.user._id);
        res.json({ message: 'Transaction deleted successfully' });
    };
}
export default new PersonalTransactionController();

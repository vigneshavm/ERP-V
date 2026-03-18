import { Request, Response } from 'express';
import { singleton } from "tsyringe";
import Transaction from '../models/transaction.model.js';

@singleton()
export class TransactionController {
  /**
   * GET /api/v1/finance/transactions
   * Paginated and tenant-scoped list of transactions
   */
  async listTransactions(req: Request, res: Response) {
    try {
      const { tenantId } = (req as any).tenant || {};
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const transactions = await Transaction.find({ tenantId, isDeleted: false })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Transaction.countDocuments({ tenantId, isDeleted: false });

      return res.status(200).json({ 
        data: transactions,
        pagination: { page, limit, total }
      });
    } catch (error) {
      return res.status(500).json({ 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch transactions' } 
      });
    }
  }

  /**
   * POST /api/v1/finance/transactions
   * Create a new transaction with idempotency support
   */
  async createTransaction(req: Request, res: Response) {
    try {
      const { tenantId } = (req as any).tenant || {};
      const { type, category, amount, currency, description, idempotencyKey } = req.body;

      // Basic validation
      if (!type || !category || !amount) {
        return res.status(400).json({ 
          error: { code: 'BAD_REQUEST', message: 'Missing required fields' } 
        });
      }

      const transaction = new Transaction({
        tenantId,
        type,
        category,
        amount,
        currency: currency || 'USD',
        description,
        idempotencyKey
      });

      await transaction.save();

      return res.status(201).json({ data: transaction });
    } catch (error: any) {
      if (error.code === 11000) { // Idempotency key conflict
        const existing = await Transaction.findOne({ idempotencyKey: req.body.idempotencyKey });
        return res.status(200).json({ data: existing });
      }
      return res.status(500).json({ 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create transaction' } 
      });
    }
  }
}

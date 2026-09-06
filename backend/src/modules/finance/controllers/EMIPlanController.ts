import { Response } from 'express';
import EMIPlan from '../models/EMIPlan.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import { AppError } from '../../../utils/AppError.js';

function buildInstallments(totalAmount: number, count: number, startDate: Date, frequency: 'MONTHLY' | 'WEEKLY') {
    const perInstallment = Math.round((totalAmount / count) * 100) / 100;
    const installments = [];
    for (let i = 0; i < count; i++) {
        const dueDate = new Date(startDate);
        if (frequency === 'MONTHLY') dueDate.setMonth(dueDate.getMonth() + i);
        else dueDate.setDate(dueDate.getDate() + i * 7);
        // Last installment absorbs any rounding remainder so the sum always equals totalAmount.
        const amount = i === count - 1
            ? Math.round((totalAmount - perInstallment * (count - 1)) * 100) / 100
            : perInstallment;
        installments.push({ dueDate, amount, status: 'PENDING' as const });
    }
    return installments;
}

export const createEMIPlan = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?._id;
        if (!tenantId || !userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { invoiceId, customerId, totalAmount, numberOfInstallments, startDate, frequency } = req.body;
        if (!invoiceId || !customerId) return res.status(400).json({ success: false, message: 'Invoice and customer are required' });
        if (!totalAmount || totalAmount <= 0) return res.status(400).json({ success: false, message: 'Total amount must be greater than zero' });
        if (!numberOfInstallments || numberOfInstallments < 1) return res.status(400).json({ success: false, message: 'At least one installment is required' });

        const start = startDate ? new Date(startDate) : new Date();
        const freq = frequency === 'WEEKLY' ? 'WEEKLY' : 'MONTHLY';
        const installments = buildInstallments(totalAmount, numberOfInstallments, start, freq);

        const plan = await EMIPlan.create({
            tenantId,
            invoiceId,
            customerId,
            totalAmount,
            numberOfInstallments,
            installmentAmount: installments[0].amount,
            startDate: start,
            frequency: freq,
            installments,
            status: 'ACTIVE',
            createdBy: userId
        });

        res.status(201).json({ success: true, data: plan });
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
};

export const getEMIPlans = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const query: Record<string, any> = { tenantId };
        if (req.query.customerId) query.customerId = req.query.customerId;
        if (req.query.status) query.status = req.query.status;

        const plans = await EMIPlan.find(query)
            .sort({ createdAt: -1 })
            .populate('customerId', 'name phone')
            .populate('invoiceId', 'invoiceNumber');
        res.status(200).json({ success: true, data: plans });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Marks one installment PAID and rolls the plan up to COMPLETED once every
// installment is paid -- the main business action this registry exists for.
export const recordInstallmentPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { id } = req.params;
        const { installmentIndex, paidAmount } = req.body;

        const plan = await EMIPlan.findOne({ _id: id, tenantId });
        if (!plan) throw new AppError('EMI plan not found', 404);

        const installment = plan.installments[installmentIndex];
        if (!installment) throw new AppError('Installment not found', 404);
        if (installment.status === 'PAID') throw new AppError('This installment is already paid', 400);

        installment.status = 'PAID';
        installment.paidDate = new Date();
        installment.paidAmount = paidAmount ?? installment.amount;

        if (plan.installments.every((i: any) => i.status === 'PAID')) {
            plan.status = 'COMPLETED';
        }

        await plan.save();
        res.status(200).json({ success: true, data: plan });
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
};

export const deleteEMIPlan = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const plan = await EMIPlan.findOneAndDelete({ _id: req.params.id, tenantId });
        if (!plan) return res.status(404).json({ success: false, message: 'EMI plan not found' });

        res.status(200).json({ success: true, message: 'EMI plan deleted' });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

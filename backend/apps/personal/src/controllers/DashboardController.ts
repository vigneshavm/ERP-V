import { Request, Response } from 'express';
import User from '@smarterp/core/modules/core/models/User.js';
import SmsTransaction from '@smarterp/core/modules/sms-tracker/models/SmsTransaction.js';
import PersonalTransaction from '@smarterp/core/modules/expense/models/PersonalTransaction.js';
import { error } from '@smarterp/shared/config/logger.js';

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        [key: string]: any;
    };
}

export const getDashboardData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        // 1. Get User Profile (Wealth, Currency)
        const user = await User.findById(userId).select('name email totalWealth currency');
        
        // 2. SMS Transfers (Pending count)
        const pendingSmsCount = await SmsTransaction.countDocuments({ 
            userId, 
            status: 'pending' 
        });
        
        const lastSms = await SmsTransaction.findOne({ userId })
            .sort({ createdAt: -1 })
            .select('createdAt');

        // 3. Monthly Summaries (Simplified for now - can be expanded)
        // Aggregating income/expense per month for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6));

        const monthlySummaries = await PersonalTransaction.aggregate([
            {
                $match: {
                    userId: userId,
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        year: { $year: "$date" }
                    },
                    income: {
                        $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] }
                    },
                    expense: {
                        $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id.month",
                    year: "$_id.year",
                    income: 1,
                    expense: 1,
                    budget: { $literal: 0 }, // Placeholder if not implemented
                    progress: { $literal: 0 }
                }
            },
            { $sort: { year: -1, month: -1 } }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedSummaries = monthlySummaries.map(s => ({
            month: `${monthNames[s.month - 1]} ${s.year}`,
            income: s.income,
            expense: s.expense,
            budget: 0,
            progress: 0,
            isCurrentMonth: s.month === (new Date().getMonth() + 1) && s.year === new Date().getFullYear()
        }));

        res.status(200).json({
            profile: {
                totalWealth: user?.totalWealth || 0,
                currency: user?.currency || 'INR',
                name: user?.name,
                email: user?.email
            },
            smsTransfers: {
                pendingCount: pendingSmsCount,
                lastDetected: lastSms?.createdAt || null
            },
            monthlySummaries: formattedSummaries
        });
    } catch (err) {
        error(`Dashboard Data Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

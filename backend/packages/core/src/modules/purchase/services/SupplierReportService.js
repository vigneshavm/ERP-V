import Bill from '@smarterp/core/modules/finance/models/Bill.js';
import Purchase from "../models/Purchase.js";
// Supplier and mongoose removed to fix build
export const getPayablesOverview = async (tenantId) => {
    // Top 10 Suppliers by Outstanding Amount
    const payables = await Bill.aggregate([
        {
            $match: {
                tenantId,
                status: { $in: ['unpaid', 'overdue', 'partial'] }
            }
        },
        {
            $group: {
                _id: "$supplier",
                totalOutstanding: { $sum: { $subtract: ["$amount", "$paidAmount"] } },
                count: { $sum: 1 }
            }
        },
        { $sort: { totalOutstanding: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "suppliers",
                localField: "_id",
                foreignField: "_id",
                as: "supplierDetails"
            }
        },
        { $unwind: "$supplierDetails" },
        {
            $project: {
                supplierName: "$supplierDetails.businessName",
                totalOutstanding: 1,
                count: 1
            }
        }
    ]);
    return payables;
};
export const getPurchaseTrends = async (tenantId) => {
    // Last 6 Months Trends
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const trends = await Purchase.aggregate([
        {
            $match: {
                tenantId,
                date: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: "$date" },
                    year: { $year: "$date" }
                },
                totalAmount: { $sum: "$totalAmount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    return trends;
};
export const getCashFlowForecast = async (tenantId) => {
    // Due Date Projection for next 8 weeks
    const today = new Date();
    const eightWeeksLater = new Date();
    eightWeeksLater.setDate(today.getDate() + 56);
    const forecast = await Bill.aggregate([
        {
            $match: {
                tenantId,
                status: { $in: ['unpaid', 'partial', 'overdue'] },
                dueDate: { $gte: today, $lte: eightWeeksLater }
            }
        },
        {
            $group: {
                _id: { $week: "$dueDate" },
                amountDue: { $sum: { $subtract: ["$amount", "$paidAmount"] } }
            }
        },
        { $sort: { "_id": 1 } }
    ]);
    return forecast;
};
export const getProfitabilityAnalysis = async (tenantId) => {
    // Supplier contribution to margin (Top 5)
    // Assuming 'margin' field in Purchase items is populated correctly
    const profitability = await Purchase.aggregate([
        { $match: { tenantId } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$vendorId",
                totalMargin: { $sum: { $ifNull: ["$items.margin", 0] } },
                totalRevenue: { $sum: "$items.amount" }
            }
        },
        { $sort: { totalMargin: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: "suppliers",
                localField: "_id",
                foreignField: "_id",
                as: "supplierDetails"
            }
        },
        { $unwind: "$supplierDetails" },
        {
            $project: {
                supplierName: "$supplierDetails.businessName",
                totalMargin: 1,
                marginPercent: {
                    $cond: [
                        { $eq: ["$totalRevenue", 0] },
                        0,
                        { $multiply: [{ $divide: ["$totalMargin", "$totalRevenue"] }, 100] }
                    ]
                }
            }
        }
    ]);
    return profitability;
};
export const getOverdueList = async (tenantId) => {
    const today = new Date();
    return await Bill.find({
        tenantId,
        status: { $in: ['overdue', 'unpaid'] },
        dueDate: { $lt: today }
    })
        .populate('supplier', 'businessName contactNo')
        .sort({ dueDate: 1 })
        .limit(20);
};
export default {
    getPayablesOverview,
    getPurchaseTrends,
    getCashFlowForecast,
    getProfitabilityAnalysis,
    getOverdueList
};

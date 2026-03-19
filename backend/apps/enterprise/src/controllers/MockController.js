export const getMockJournalEntries = (req, res) => {
    res.json([
        {
            id: 'j1',
            date: new Date().toISOString(),
            reference: 'JV/2026/001',
            description: 'Opening balance for Petty Cash (API Mock)',
            status: 'POSTED',
            entries: [{ accountId: '101', accountName: 'Petty Cash', debit: 1000, credit: 0 }]
        },
        {
            id: 'j2',
            date: new Date().toISOString(),
            reference: 'JV/2026/002',
            description: 'Salary distribution for March 2026 (API Mock)',
            status: 'POSTED',
            entries: [
                { accountId: '501', accountName: 'Salary Expense', debit: 500000, credit: 0 },
                { accountId: '102', accountName: 'HDFC Bank Account', debit: 0, credit: 500000 }
            ]
        }
    ]);
};
export const getMockStockReport = (req, res) => {
    res.json({
        summary: { totalItems: 1250, lowStockItems: 15, totalValue: 8540000 },
        items: [
            { id: 'p1', name: 'Industrial Motor A1 (API Mock)', sku: 'MOT-A1', stockQty: 45, minStockLevel: 10, costPrice: 15000 },
            { id: 'p2', name: 'Precision Gears (API Mock)', sku: 'GEAR-P2', stockQty: 8, minStockLevel: 20, costPrice: 2500 },
            { id: 'p3', name: 'Heavy Duty Bearings (API Mock)', sku: 'BEAR-H3', stockQty: 120, minStockLevel: 50, costPrice: 850 },
        ]
    });
};
export const getMockDashboardStats = (req, res) => {
    res.json({
        totalRevenue: 2450000,
        totalOutstanding: 450000,
        totalBalance: 1250000,
        totalProfit: 850000,
        dailySales: [
            { _id: '2026-03-10', totalSales: 120000 },
            { _id: '2026-03-11', totalSales: 150000 },
            { _id: '2026-03-12', totalSales: 95000 },
            { _id: '2026-03-13', totalSales: 110000 },
            { _id: '2026-03-14', totalSales: 210000 },
            { _id: '2026-03-15', totalSales: 180000 },
            { _id: '2026-03-16', totalSales: 240000 },
        ],
        revenueVsExpenses: [
            { month: '2025-10', revenue: 1800000, expenses: 1400000 },
            { month: '2025-11', revenue: 2100000, expenses: 1600000 },
            { month: '2025-12', revenue: 2400000, expenses: 1800000 },
            { month: '2026-01', revenue: 2000000, expenses: 1550000 },
            { month: '2026-02', revenue: 2300000, expenses: 1750000 },
            { month: '2026-03', revenue: 2500000, expenses: 1900000 },
        ]
    });
};
export const getMockSuppliers = (req, res) => {
    res.json([
        { id: 's1', name: 'Zenith Engineering (API Mock)', netBalance: 125000, totalInvoices: 12, lastPaymentDate: '2026-02-15' },
        { id: 's2', name: 'Global Logistics Corp (API Mock)', netBalance: 45000, totalInvoices: 8, lastPaymentDate: '2026-03-01' },
        { id: 's3', name: 'Precision Parts Ltd (API Mock)', netBalance: 0, totalInvoices: 25, lastPaymentDate: '2026-03-10' },
    ]);
};
export const getMockBusinessProfile = (req, res) => {
    res.json({
        success: true,
        data: {
            _id: 'tenant_123',
            userId: 'user_123',
            businessName: 'Vignesh Enterprise',
            email: 'vignesh@expancer.com',
            phone: '+91 9876543210',
            address: '123 Tech Park, Chennai',
            category: 'Retail',
            businessType: 'Private Limited'
        }
    });
};
export const getMockEmployees = (req, res) => {
    res.json({
        success: true,
        data: [
            { _id: 'emp_1', name: 'John Doe', role: 'Manager' },
            { _id: 'emp_2', name: 'Jane Smith', role: 'Developer' }
        ]
    });
};

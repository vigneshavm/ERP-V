import { Request, Response } from 'express';

export const getMockJournalEntries = (req: Request, res: Response) => {
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

export const getMockStockReport = (req: Request, res: Response) => {
    res.json({
        summary: { totalItems: 1250, lowStockItems: 15, totalValue: 8540000 },
        items: [
            { id: 'p1', name: 'Industrial Motor A1 (API Mock)', sku: 'MOT-A1', stockQty: 45, minStockLevel: 10, costPrice: 15000 },
            { id: 'p2', name: 'Precision Gears (API Mock)', sku: 'GEAR-P2', stockQty: 8, minStockLevel: 20, costPrice: 2500 },
            { id: 'p3', name: 'Heavy Duty Bearings (API Mock)', sku: 'BEAR-H3', stockQty: 120, minStockLevel: 50, costPrice: 850 },
        ]
    });
};

export const getMockDashboardStats = (req: Request, res: Response) => {
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

export const getMockSuppliers = (req: Request, res: Response) => {
    res.json([
        { id: 's1', name: 'Zenith Engineering (API Mock)', netBalance: 125000, totalInvoices: 12, lastPaymentDate: '2026-02-15' },
        { id: 's2', name: 'Global Logistics Corp (API Mock)', netBalance: 45000, totalInvoices: 8, lastPaymentDate: '2026-03-01' },
        { id: 's3', name: 'Precision Parts Ltd (API Mock)', netBalance: 0, totalInvoices: 25, lastPaymentDate: '2026-03-10' },
    ]);
};

export const getMockBusinessProfile = (req: Request, res: Response) => {
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

export const getMockEmployees = (req: Request, res: Response) => {
    res.json({
        success: true,
        data: [
            { _id: 'emp_1', name: 'John Doe', role: 'Manager' },
            { _id: 'emp_2', name: 'Jane Smith', role: 'Developer' }
        ]
    });
};

export const getMockSalesOrders = (req: Request, res: Response) => {
    res.json([
        {
            _id: 'so1',
            orderNumber: 'SO-2026-001',
            orderDate: new Date('2026-03-15').toISOString(),
            expectedDeliveryDate: new Date('2026-03-25').toISOString(),
            status: 'Confirmed',
            totalAmount: 12500,
            customer: { name: 'Acme Corp', phone: '9876543210' }
        },
        {
            _id: 'so2',
            orderNumber: 'SO-2026-002',
            orderDate: new Date('2026-03-18').toISOString(),
            expectedDeliveryDate: new Date('2026-03-20').toISOString(),
            status: 'Delivered',
            totalAmount: 4500,
            customer: { name: 'Global Tech', phone: '9988776655' }
        },
        {
            _id: 'so3',
            orderNumber: 'SO-2026-003',
            orderDate: new Date('2026-03-20').toISOString(),
            expectedDeliveryDate: new Date('2026-03-22').toISOString(),
            status: 'Draft',
            totalAmount: 8900,
            customer: { name: 'Tech Solutions', phone: '9123456780' }
        }
    ]);
};

export const getMockDailyAttendance = (req: Request, res: Response) => {
    res.json({
        success: true,
        data: [] // Start with empty for the date
    });
};

export const markAttendanceMock = (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Attendance marked successfully (API Mock)'
    });
};

export const getMockExpenseReport = (req: Request, res: Response) => {
    res.json({
        report_period: 'March 2026',
        total_expense: 125000,
        by_category: [
            { category: 'Logistics', amount: 45000, percentage: '36%', budget: 40000, variance: 5000, variancePercentage: 12.5, type: 'VARIABLE', status: 'OVER' },
            { category: 'Inventory', amount: 35000, percentage: '28%', budget: 40000, variance: -5000, variancePercentage: -12.5, type: 'VARIABLE', status: 'UNDER' },
            { category: 'Salaries', amount: 30000, percentage: '24%', budget: 30000, variance: 0, variancePercentage: 0, type: 'FIXED', status: 'NONE' },
            { category: 'Utilities', amount: 15000, percentage: '12%', budget: 12000, variance: 3000, variancePercentage: 25, type: 'FIXED', status: 'OVER' },
        ],
        by_branch: [
            { branch: 'Main Node', amount: 85000, percentage: 68, risk: 'LOW' },
            { branch: 'Coimbatore Node', amount: 40000, percentage: 32, risk: 'MEDIUM' },
        ],
        by_payment_mode: [
            { mode: 'BANK_TRANSFER', amount: 80000, percentage: 64 },
            { mode: 'CASH', amount: 25000, percentage: 20 },
            { mode: 'UPI', amount: 20000, percentage: 16 },
        ],
        audit_flags: [
            'Logistics cost spiked by 12.5% vs budget',
            'High cash usage in Coimbatore operations',
            'Utility costs are 25% over planned budget'
        ],
        recommendations: [
            'Switch to digital payments for Coimbatore logistics',
            'Optimize cooling systems to reduce utility overhead',
            'Consolidate inventory shipments to reduce logistics variance'
        ],
        monthly_trends: [
            { month: 'Oct', year: 2025, expense: 110000, income: 165000, budget_utilization: 70, label: 'Oct 2025' },
            { month: 'Nov', year: 2025, expense: 115000, income: 172000, budget_utilization: 73, label: 'Nov 2025' },
            { month: 'Dec', year: 2025, expense: 130000, income: 195000, budget_utilization: 82, label: 'Dec 2025' },
            { month: 'Jan', year: 2026, expense: 120000, income: 180000, budget_utilization: 76, label: 'Jan 2026' },
            { month: 'Feb', year: 2026, expense: 125000, income: 187000, budget_utilization: 79, label: 'Feb 2026' },
            { month: 'Mar', year: 2026, expense: 125000, income: 187500, budget_utilization: 75, label: 'Mar 2026' },
        ]
    });
};

export const getMockAdvances = (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const advances = [
        { _id: 'adv_1', employeeId: 'emp_1', amount: 5000, date: '2026-03-01', type: 'SALARY_ADVANCE', notes: 'Urgent medical expense' },
        { _id: 'adv_2', employeeId: 'emp_2', amount: 2000, date: '2026-03-10', type: 'TRAVEL_ADVANCE', notes: 'Client meeting in Chennai' },
        { _id: 'adv_3', employeeId: 'emp_1', amount: 1500, date: '2026-03-15', type: 'SALARY_ADVANCE', notes: 'Personal loan' },
    ];

    const targetEmpId = employeeId || (req.query.employeeId as string);
    const filtered = targetEmpId 
        ? advances.filter(a => a.employeeId === targetEmpId) 
        : advances;
        
    res.json({ success: true, data: filtered });
};

export const getMockLeaves = (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const leaves = [
        { _id: 'lv_1', employeeId: 'emp_1', startDate: '2026-03-22', endDate: '2026-03-24', type: 'SICK', status: 'APPROVED', reason: 'Flu' },
        { _id: 'lv_2', employeeId: 'emp_2', startDate: '2026-04-05', endDate: '2026-04-10', type: 'CASUAL', status: 'PENDING', reason: 'Family function' },
    ];

    const targetEmpId = employeeId || (req.query.employeeId as string);
    const filtered = targetEmpId
        ? leaves.filter(l => l.employeeId === targetEmpId)
        : leaves;
        
    res.json({ success: true, data: filtered });
};

export const getMockHolidays = (req: Request, res: Response) => {
    res.json({
        success: true,
        data: [
            { _id: 'h_1', name: 'New Year', date: '2026-01-01', type: 'PUBLIC' },
            { _id: 'h_2', name: 'Pongal', date: '2026-01-14', type: 'PUBLIC' },
            { _id: 'h_3', name: 'Republic Day', date: '2026-01-26', type: 'PUBLIC' },
            { _id: 'h_4', name: 'Labor Day', date: '2026-05-01', type: 'PUBLIC' },
        ]
    });
};

export const getMockSalaryComponents = (req: Request, res: Response) => {
    res.json({
        success: true,
        data: [
            { _id: 'comp_1', name: 'Basic Salary', type: 'EARNING', calculationType: 'FLAT', defaultValue: 25000, isActive: true },
            { _id: 'comp_2', name: 'HRA', type: 'EARNING', calculationType: 'PERCENTAGE', defaultValue: 40, isActive: true },
            { _id: 'comp_3', name: 'Professional Tax', type: 'DEDUCTION', calculationType: 'FLAT', defaultValue: 200, isActive: true },
        ]
    });
};

export const getMockSalaryStructures = (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const structures = [
        { _id: 'struct_1', employeeId: 'emp_1', components: [{ componentId: 'comp_1', amount: 30000 }, { componentId: 'comp_2', amount: 12000 }], isActive: true },
        { _id: 'struct_2', employeeId: 'emp_2', components: [{ componentId: 'comp_1', amount: 25000 }, { componentId: 'comp_2', amount: 10000 }], isActive: true },
    ];
    
    if (employeeId) {
        const struct = structures.find(s => s.employeeId === employeeId);
        return res.json({ success: true, data: struct });
    }
    
    res.json({ success: true, data: structures });
};

export const getMockPayrollRuns = (req: Request, res: Response) => {
    const { id } = req.params;
    const runs = [
        { _id: 'run_1', periodStart: '2026-02-01', periodEnd: '2026-02-28', totalAmount: 550000, status: 'PAID', processedDate: '2026-03-01' },
        { _id: 'run_2', periodStart: '2026-03-01', periodEnd: '2026-03-31', totalAmount: 560000, status: 'APPROVED', processedDate: '2026-03-20' },
    ];

    if (id) {
        const run = runs.find(r => r._id === id);
        return res.json({ 
            success: true, 
            data: { 
                run, 
                payslips: [
                    { _id: 'ps_1', employeeId: { _id: 'emp_1', name: 'John Doe' }, netSalary: 42000, status: 'PAID' },
                    { _id: 'ps_2', employeeId: { _id: 'emp_2', name: 'Jane Smith' }, netSalary: 35000, status: 'PAID' }
                ] 
            } 
        });
    }

    res.json({ success: true, data: runs });
};

export const getMockAttendanceSummary = (req: Request, res: Response) => {
    const { month, year } = req.query;
    res.json({
        success: true,
        data: [
            { employeeId: 'emp_1', totalDays: 31, workedDays: 20, leavesTaken: 2, holidays: 4, weeklyOffs: 4, overtimeHours: 5 },
            { employeeId: 'emp_2', totalDays: 31, workedDays: 22, leavesTaken: 0, holidays: 4, weeklyOffs: 4, overtimeHours: 2 },
        ]
    });
};



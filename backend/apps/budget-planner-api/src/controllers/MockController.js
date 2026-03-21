export const getMockUser = (req, res) => {
    res.json({
        id: 'u1',
        name: 'Vignesh K (API Mock)',
        email: 'vignesh.chennai@example.com',
        currency: 'INR',
        totalWealth: 1254500,
        monthStartDay: 1,
        createdAt: new Date().toISOString()
    });
};
export const getMockTransactions = (req, res) => {
    res.json([
        {
            id: 't1', type: 'expense', amount: 450, category: 'Food', accountName: 'SBI',
            date: new Date().toISOString(), description: 'Lunch at Sangeetha (API Mock)',
            paymentMethod: 'UPI', createdAt: new Date().toISOString()
        },
        {
            id: 't2', type: 'income', amount: 120000, category: 'Salary', accountName: 'HDFC',
            date: new Date().toISOString(), description: 'Monthly Salary (API Mock)',
            paymentMethod: 'Bank Transfer', createdAt: new Date().toISOString()
        }
    ]);
};
export const getMockAnalytics = (req, res) => {
    res.json({
        totalIncome: 154000,
        totalExpense: 92400,
        savingsRate: 40,
        topCategories: [
            { category: 'Rent', amount: 25000, percentage: 27 },
            { category: 'Groceries', amount: 15400, percentage: 17 }
        ],
        monthlyTrend: [
            { month: 'Jan', income: 140000, expense: 85000 },
            { month: 'Feb', income: 140000, expense: 91000 },
            { month: 'Mar', income: 154000, expense: 92400 }
        ]
    });
};

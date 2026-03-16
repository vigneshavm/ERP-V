import { PersonalTransaction, ExpenseHistory, PersonalTransactionType } from '../types';

export const mapTransactionsToHistory = (transactions: PersonalTransaction[], type: PersonalTransactionType): ExpenseHistory => {
    const filtered = transactions.filter(t => t.type === type);
    const totalSpent = filtered.reduce((acc, t) => acc + t.amount, 0);
    
    // Group by category
    const categoryMap: Record<string, { value: number; color: string }> = {};
    const paymentMap: Record<string, { value: number }> = {};
    
    filtered.forEach(t => {
        if (!categoryMap[t.category]) {
            categoryMap[t.category] = { value: 0, color: '#ccc' }; // Color mapping needed
        }
        categoryMap[t.category].value += t.amount;
        
        if (!paymentMap[t.paymentMethod]) {
            paymentMap[t.paymentMethod] = { value: 0 };
        }
        paymentMap[t.paymentMethod].value += t.amount;
    });

    const categories = Object.entries(categoryMap).map(([name, data]) => ({
        name,
        value: data.value,
        color: data.color
    }));

    const paymentMethods = Object.entries(paymentMap).map(([name, data]) => ({
        name,
        value: data.value,
        color: '#ccc'
    }));

    // Simple daily trend (last 7 days)
    const dailyTrend: { day: string; amount: number }[] = [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(dateStr => {
        const dayAmount = filtered
            .filter(t => t.date.startsWith(dateStr))
            .reduce((acc, t) => acc + t.amount, 0);
        dailyTrend.push({
            day: dateStr.split('-')[2], // Day number for chart
            amount: dayAmount
        });
    });

    return {
        totalSpent,
        month: new Date().toLocaleString('default', { month: 'long' }),
        categories,
        paymentMethods,
        dailyTrend
    };
};

import { appData, delay, mockExpenseHistory, saveState } from '../../../services/mockState';
import { formatCurrency, ExpenseHistory, Transaction, Category } from '@repo/shared';

/**
 * Checks if a transaction is an anomaly based on past spending in that category.
 * Criteria: > 3x the average of last 5 transactions.
 */
export const checkAnomaly = async (categoryId: string, amount: number): Promise<{ isAnomaly: boolean; reason?: string }> => {
    const transactions = (appData as any).transactions || {};
    const catTxns: Transaction[] = transactions[categoryId] || [];

    if (catTxns.length < 3) return { isAnomaly: false }; // Need some history

    const lastTxns = catTxns.slice(0, 5);
    const avg = lastTxns.reduce((sum, t) => sum + t.amount, 0) / lastTxns.length;

    if (amount > avg * 3) {
        return {
            isAnomaly: true,
            reason: `This ${formatCurrency(amount)} spend is more than 3x your average for this category (${formatCurrency(avg)}).`
        };
    }

    return { isAnomaly: false };
};

export const fetchCategories = async (): Promise<Category[]> => {
    await delay(500);
    return appData.categories as Category[];
};

export const fetchExpensesHistory = async (): Promise<ExpenseHistory> => {
    await delay(500);
    return { ...mockExpenseHistory };
};

export const fetchTransactionsByCategory = async (categoryId: string): Promise<Transaction[]> => {
    await delay(500);
    const transactions = (appData as any).transactions || {};
    return transactions[categoryId] || [];
};

export const submitExpenseTransaction = async (amount: number, categoryName: string, notes?: string): Promise<{ id: string; isAnomaly: boolean; anomalyReason?: string }> => {
    await delay(200);
    saveState();

    // Update Wealth
    appData.profile.totalWealth -= amount;
    if (appData.monthlySummaries && appData.monthlySummaries[0]) {
        appData.monthlySummaries[0].expense += amount;
    }

    // Update Budget
    if (appData.budget && appData.budget.items) {
        const budgetItem = appData.budget.items.find((i: { name: string; spent: number; total: number; overspent: boolean }) => i.name === categoryName);
        if (budgetItem) {
            budgetItem.spent += amount;
            if (budgetItem.spent > budgetItem.total) {
                budgetItem.overspent = true;
            }
        }
    }

    // Update Expense History
    mockExpenseHistory.totalSpent += amount;
    const historyCategory = mockExpenseHistory.categories.find(c => c.name === categoryName);
    if (historyCategory) {
        historyCategory.value += amount;
    } else {
        mockExpenseHistory.categories.push({ name: categoryName, value: amount, color: '#2ECC71' }); 
    }

    // Update main categories list
    if (appData.categories) {
        const mainCat = appData.categories.find((c: any) => c.name === categoryName);
        if (mainCat) {
            mainCat.value += amount;
            if (mainCat.value > mainCat.limit) {
                mainCat.over = true;
            }
        }
    }

    // Check for Anomaly
    const matchedCat = appData.categories?.find((c: any) => c.name === categoryName);
    const catId = matchedCat ? matchedCat.id : categoryName.toLowerCase();

    const anomalyStatus = await checkAnomaly(catId, amount);

    const now = new Date();
    const isoDate = now.toISOString().split('T')[0];
    const txnId = crypto.randomUUID();

    if (!appData.transactions[catId]) appData.transactions[catId] = [];
    appData.transactions[catId].unshift({
        id: txnId,
        name: categoryName,
        amount,
        date: isoDate,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: notes || undefined,
        isAnomaly: anomalyStatus.isAnomaly,
        anomalyReason: anomalyStatus.reason
    });

    // Add notification if anomaly
    if (anomalyStatus.isAnomaly) {
        if (!appData.notifications) appData.notifications = [];
        appData.notifications.unshift({
            id: Date.now(),
            type: 'warning',
            title: 'Unusual Spend Detected',
            time: 'Just now',
            amount: amount,
            message: anomalyStatus.reason || `Large spend in ${categoryName}.`,
            icon: 'AlertTriangle',
            color: '#FF9500',
            read: false
        });
    }

    // Recalculate progress for the current month summary
    if (appData.monthlySummaries && appData.monthlySummaries[0]) {
        const summary = appData.monthlySummaries[0];
        summary.progress = Math.min(100, (summary.expense / summary.budget) * 100);
        if (summary.progress > 90) summary.showPredictive = true;
    }

    return { id: txnId, isAnomaly: anomalyStatus.isAnomaly, anomalyReason: anomalyStatus.reason };
};

export const createCategory = async (
    name: string,
    icon: string,
    color: string,
    limit: number
): Promise<Category> => {
    await delay(200);
    saveState();
    const newCategory: Category = {
        id: crypto.randomUUID(),
        name,
        icon,
        emoji: "💰", // Default emoji
        type: "expense", // Default type
        color,
        value: 0,
        limit,
        over: false,
    };
    if (!appData.categories) appData.categories = [];
    appData.categories.push(newCategory);
    return newCategory;
};

export const updateCategory = async (
    id: string,
    updates: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'limit'>>
): Promise<void> => {
    await delay(200);
    saveState();
    const cat = appData.categories?.find((c: any) => c.id === id);
    if (cat) Object.assign(cat, updates);
};

export const deleteCategory = async (id: string): Promise<void> => {
    await delay(200);
    saveState();
    if (appData.categories) {
        appData.categories = appData.categories.filter((c: any) => c.id !== id);
    }
    if (appData.transactions && (appData.transactions as any)[id]) {
        delete (appData.transactions as any)[id];
    }
};

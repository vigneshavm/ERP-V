import { appData, delay, saveState, mockExpenseHistory } from '../../../services/mockState';
import { Transaction, Category, CalendarTransaction } from '@repo/shared';

export const fetchAllTransactions = async (): Promise<CalendarTransaction[]> => {
    await delay(300);
    const allTxns: CalendarTransaction[] = [];
    const txnMap: Record<string, Transaction[]> = (appData as any).transactions || {};
    const categories: Category[] = appData.categories || [];

    for (const cat of categories) {
        const catTxns: Transaction[] = txnMap[cat.id] || [];
        for (const txn of catTxns) {
            allTxns.push({
                ...txn,
                categoryId: cat.id,
                categoryName: cat.name,
                categoryColor: cat.color,
                categoryIcon: cat.icon,
            });
        }
    }

    // Sort newest first
    allTxns.sort((a, b) => {
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const dateCompare = timeB - timeA;
        if (dateCompare !== 0) return dateCompare;
        return (b.time || '').localeCompare(a.time || '');
    });

    return allTxns;
};

export const bulkUpdateTransactions = async (ids: string[], targetCategoryId: string): Promise<void> => {
    await delay(500);
    saveState();

    const categories = appData.categories || [];
    const targetCat = categories.find((c: any) => c.id === targetCategoryId);
    if (!targetCat) return;

    const transactionMap = appData.transactions || {};

    ids.forEach(id => {
        let foundTxn: any = null;
        let sourceCatId: string = '';

        // Find transaction
        for (const catId in transactionMap) {
            const index = transactionMap[catId].findIndex((t: any) => t.id === id);
            if (index !== -1) {
                foundTxn = transactionMap[catId].splice(index, 1)[0];
                sourceCatId = catId;
                break;
            }
        }

        if (foundTxn) {
            // Update counts/values in source category
            const sourceCat = categories.find((c: any) => c.id === sourceCatId);
            if (sourceCat) {
                sourceCat.value -= foundTxn.amount;
                sourceCat.over = sourceCat.value > sourceCat.limit;
            }

            // Move to target category
            if (!transactionMap[targetCategoryId]) transactionMap[targetCategoryId] = [];
            transactionMap[targetCategoryId].unshift(foundTxn);
            targetCat.value += foundTxn.amount;
            targetCat.over = targetCat.value > targetCat.limit;
        }
    });

    // Recalculate summary
    if (appData.monthlySummaries && appData.monthlySummaries[0]) {
        const summary = appData.monthlySummaries[0];
        summary.progress = Math.min(100, (summary.expense / summary.budget) * 100);
    }
};

export const bulkDeleteTransactions = async (ids: string[]): Promise<void> => {
    await delay(500);
    saveState();

    const transactionMap = appData.transactions || {};
    const categories = appData.categories || [];

    ids.forEach(id => {
        for (const catId in transactionMap) {
            const index = transactionMap[catId].findIndex((t: any) => t.id === id);
            if (index !== -1) {
                const deletedTxn = transactionMap[catId].splice(index, 1)[0];

                // Update wealth and category totals
                appData.profile.totalWealth += deletedTxn.amount; // Assuming expense deletion
                const cat = categories.find((c: any) => c.id === catId);
                if (cat) {
                    cat.value -= deletedTxn.amount;
                    cat.over = cat.value > cat.limit;
                }

                if (appData.monthlySummaries && appData.monthlySummaries[0]) {
                    appData.monthlySummaries[0].expense -= deletedTxn.amount;
                }
                break;
            }
        }
    });

    // Recalculate summary
    if (appData.monthlySummaries && appData.monthlySummaries[0]) {
        const summary = appData.monthlySummaries[0];
        summary.progress = Math.min(100, (summary.expense / summary.budget) * 100);
    }
};

export const fetchAccounts = async (): Promise<any[]> => {
    await delay(500);
    return appData.accounts || [];
};

export const createAccount = async (account: {
    name: string;
    type: string;
    balance: number;
    color: string;
}): Promise<any> => {
    await delay(200);
    const newAccount = {
        id: Date.now(),
        income: 0,
        expense: 0,
        selected: false,
        ...account,
    };
    if (!appData.accounts) appData.accounts = [];
    appData.accounts.push(newAccount);
    return newAccount;
};

export const disputeTransaction = async (transactionId: string): Promise<void> => {
    await delay(300);
    saveState();

    const transactionMap = appData.transactions || {};
    const categories = appData.categories || [];

    for (const catId in transactionMap) {
        const index = transactionMap[catId].findIndex((t: any) => t.id === transactionId);
        if (index !== -1) {
            const extra = transactionMap[catId].splice(index, 1)[0];

            // Revert wealth
            appData.profile.totalWealth += extra.amount;
            appData.monthlySummaries[0].expense -= extra.amount;

            // Revert category value
            const cat = categories.find((c: any) => c.id === catId);
            if (cat) {
                cat.value -= extra.amount;
                cat.over = cat.value > cat.limit;
            }

            // Revert budget spent
            if (appData.budget && appData.budget.items) {
                const budgetItem = appData.budget.items.find((i: any) => i.name === cat?.name);
                if (budgetItem) {
                    budgetItem.spent -= extra.amount;
                    budgetItem.overspent = budgetItem.spent > budgetItem.total;
                }
            }

            // Revert expense history
            mockExpenseHistory.totalSpent -= extra.amount;
            const historyCategory = mockExpenseHistory.categories.find(c => c.name === cat?.name);
            if (historyCategory) {
                historyCategory.value -= extra.amount;
            }

            break;
        }
    }
};

export const fetchContacts = async (): Promise<any[]> => {
    await delay(300);
    return [
        { id: 'u1', name: 'Sarah Miller', initials: 'SM', color: '#E74C3C' },
        { id: 'u2', name: 'David Smith', initials: 'DS', color: '#3498DB' },
        { id: 'u3', name: 'Emma Wilson', initials: 'EW', color: '#F1C40F' },
        { id: 'u4', name: 'Michael Brown', initials: 'MB', color: '#9B59B6' },
        { id: 'u5', name: 'Olivia Jones', initials: 'OJ', color: '#2ECC71' }
    ];
};

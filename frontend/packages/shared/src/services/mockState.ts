import mockData from '../mock/data.json';
import { formatCurrency, delay } from '../utils';
import { ExpenseHistory, SMSMessage } from '../types';

// Mutable in-memory store for the mock session
export let appData: any = JSON.parse(JSON.stringify(mockData));

// Undo/Redo Stack
export let undoStack: string[] = [];
export let redoStack: string[] = [];

export const saveState = () => {
    undoStack.push(JSON.stringify(appData));
    if (undoStack.length > 50) undoStack.shift(); // Limit stack size
    redoStack = []; // Clear redo stack on new action
};

export const resetState = (newData: any) => {
    appData = JSON.parse(JSON.stringify(newData));
};

export const setAppData = (data: any) => {
    appData = data;
};

export let mockExpenseHistory: ExpenseHistory = {
    totalSpent: 1495765,
    month: "June 2025",
    categories: [
        { name: 'Transportation', value: 35279, color: '#3498DB' },
        { name: 'Mobile/Internet', value: 15300, color: '#9B59B6' },
        { name: 'Bills', value: 14190, color: '#F1C40F' },
        { name: 'Healthcare', value: 1650, color: '#E74C3C' },
        { name: 'Food/Drinks', value: 1350, color: '#2ECC71' },
        { name: 'Others', value: 1427996, color: '#E67E22' },
    ],
    paymentMethods: [
        { name: 'Cash', value: 45000, color: '#2ECC71' },
        { name: 'Account', value: 125000, color: '#3498DB' },
    ],
    dailyTrend: [
        { day: 'Mon', amount: 1200 },
        { day: 'Tue', amount: 3400 },
        { day: 'Wed', amount: 1100 },
        { day: 'Thu', amount: 5600 },
        { day: 'Fri', amount: 2300 },
        { day: 'Sat', amount: 4500 },
        { day: 'Sun', amount: 3200 },
    ]
};


export let smsMockMessages: SMSMessage[] = [
    { id: 1, sender: 'HDFC BANK', amount: 1250, date: 'Today, 02:30 PM', message: `Spent ${formatCurrency(1250)} at Amazon India using HDFC Card xx1234.`, type: 'Debit' },
    { id: 2, sender: 'SBIINB', amount: 45000, date: 'Today, 10:15 AM', message: `Salary of ${formatCurrency(45000)} credited to your A/c xx7890.`, type: 'Credit' },
    { id: 3, sender: 'ZOMATO', amount: 485, date: 'Yesterday, 08:45 PM', message: `Paid ${formatCurrency(485)} for your order on Zomato.`, type: 'Debit' },
    { id: 4, sender: 'ICICI BANK', amount: 2100, date: 'Yesterday, 11:20 AM', message: `Transaction of ${formatCurrency(2100)} at Shell Petrol Pump.`, type: 'Debit' },
];

export const updateSMSMessages = (updater: (messages: SMSMessage[]) => SMSMessage[]) => {
    smsMockMessages = updater(smsMockMessages);
};


export const undo = async (): Promise<void> => {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.stringify(appData));
    setAppData(JSON.parse(undoStack.pop()!));
    await delay(100);
};

export const redo = async (): Promise<void> => {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.stringify(appData));
    setAppData(JSON.parse(redoStack.pop()!));
    await delay(100);
};

// Ensure budget has history for MFE
if (appData.budget && !appData.budget.history) {
    appData.budget.history = mockExpenseHistory;
}

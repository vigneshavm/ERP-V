"use client";

import { appData, delay, saveState } from '@repo/shared';
import { Category, Budget } from '@repo/shared';

export const fetchCategories = async (): Promise<Category[]> => {
    await delay(500);
    return appData.categories as Category[];
};

export const createCategory = async (
    name: string,
    emoji: string,
    color: string,
    limit: number
): Promise<Category> => {
    await delay(200);
    saveState();
    const newCategory: Category = {
        id: crypto.randomUUID(),
        name,
        emoji,
        color,
        type: 'expense',
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
    updates: Partial<Pick<Category, 'name' | 'emoji' | 'color' | 'limit'>>
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
    if (appData.transactions?.[id]) {
        delete appData.transactions[id];
    }
};

export const fetchBudget = async (): Promise<Budget> => {
    await delay(500);
    if (!appData.budget.mode) appData.budget.mode = 'flexible';
    return appData.budget;
};

export const updateBudgetMode = async (mode: 'zero-based' | 'flexible'): Promise<void> => {
    await delay(200);
    if (appData.budget) {
        appData.budget.mode = mode;
    }
};

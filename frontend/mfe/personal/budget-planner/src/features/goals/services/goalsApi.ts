import { appData, delay, saveState } from '../../../services/mockState';
import { Goal } from '@repo/shared';

export const fetchGoals = async (): Promise<Goal[]> => {
    await delay(500);
    return appData.goals as Goal[];
};

export const addGoal = async (goal: Omit<Goal, 'id'>): Promise<Goal> => {
    await delay(300);
    saveState();
    const newGoal: Goal = { ...goal, id: Date.now() };
    if (!appData.goals) appData.goals = [];
    appData.goals.push(newGoal);
    return newGoal;
};

export const updateGoalProgress = async (id: number | string, current: number): Promise<void> => {
    await delay(300);
    saveState();
    const goal = appData.goals?.find((g: Goal) => g.id === Number(id));
    if (goal) goal.current = current;
};

export const deleteGoal = async (id: number): Promise<void> => {
    await delay(300);
    saveState();
    if (appData.goals) {
        appData.goals = appData.goals.filter((g: Goal) => g.id !== id);
    }
};

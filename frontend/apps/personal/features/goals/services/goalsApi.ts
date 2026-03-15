import { api } from '@repo/shared';
import { Goal } from '@repo/shared';

export const fetchGoals = async (): Promise<Goal[]> => {
    return api.get<Goal[]>('/personal/goals');
};

export const addGoal = async (goal: Omit<Goal, 'id'>): Promise<Goal> => {
    return api.post<Goal>('/personal/goals', goal);
};

export const updateGoalProgress = async (id: number | string, current: number): Promise<void> => {
    return api.put(`/personal/goals/${id}/progress`, { current });
};

export const deleteGoal = async (id: number): Promise<void> => {
    return api.delete(`/personal/goals/${id}`);
};


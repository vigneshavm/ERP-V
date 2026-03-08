import { z } from "zod";

export const UserSchema = z.object({
    id: z.string(),
    name: z.string().min(2),
    email: z.string().email(),
});

export const ExpenseCategorySchema = z.enum(["Personal", "Business", "Travel", "Food", "Other"]);

export const ProfileSchema = z.object({
    totalWealth: z.number().min(0),
    currency: z.string().length(3),
});

export const MonthlySummarySchema = z.object({
    month: z.string(),
    expense: z.number(),
    income: z.number(),
    budget: z.number(),
    progress: z.number().min(0).max(100),
    showPredictive: z.boolean().optional(),
    isCurrentMonth: z.boolean().optional(),
});

export const CategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    value: z.number(),
    limit: z.number(),
    color: z.string(),
    icon: z.string(),
    over: z.boolean().optional(),
});

export const ParticipantSchema = z.object({
    id: z.string(),
    name: z.string(),
    initials: z.string(),
    color: z.string(),
    contribution: z.number(),
});

export const GoalSchema = z.object({
    id: z.number(),
    name: z.string(),
    target: z.number().positive(),
    current: z.number().min(0),
    icon: z.string(),
    color: z.string(),
    deadline: z.string(),
    dailyNudge: z.number(),
    isCollaborative: z.boolean().optional(),
    participants: z.array(ParticipantSchema).optional(),
    ownerId: z.string().optional(),
});

export const LoanSchema = z.object({
    id: z.number(),
    name: z.string(),
    bank: z.string(),
    current: z.number(),
    total: z.number().positive(),
    interestRate: z.number().optional(),
    tenureMonths: z.number().optional(),
    type: z.enum(['Borrowed', 'Lent']),
    deadline: z.string(),
    icon: z.string(),
    color: z.string(),
});

export const TransactionSchema = z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number(),
    date: z.string(),
    time: z.string(),
    isAnomaly: z.boolean().optional(),
    anomalyReason: z.string().optional(),
    notes: z.string().optional(),
});

export const BudgetSchema = z.object({
    total: z.number().positive(),
    mode: z.enum(['zero-based', 'flexible']),
    items: z.array(z.object({
        name: z.string(),
        spent: z.number(),
        total: z.number(),
        icon: z.string(),
        color: z.string(),
        overspent: z.boolean(),
        rollover: z.number().optional(),
    })),
});

export const SystemConfigSchema = z.object({
    id: z.string(),
    key: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.any())]),
    lastUpdated: z.string(),
    updatedBy: z.string(),
});

export const RegistryAuditSchema = z.object({
    id: z.string(),
    action: z.enum(['PURGE', 'UPDATE', 'CREATE', 'REPAIR']),
    timestamp: z.string(),
    executor: z.string(),
    details: z.string(),
    status: z.enum(['SUCCESS', 'FAILED', 'WARNING']),
});

export const SyncStatusSchema = z.object({
    mfeId: z.string(),
    lastSync: z.string(),
    status: z.enum(['HEALTHY', 'DELAYED', 'CRITICAL']),
    version: z.string(),
});

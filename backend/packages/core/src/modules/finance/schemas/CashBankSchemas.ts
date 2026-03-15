import { z } from 'zod';

export const CreateAccountSchema = z.object({
    body: z.object({
        bankName: z.string().min(1, 'Bank name is required'),
        accountNumber: z.string().min(1, 'Account number is required'),
        accountType: z.enum(['Current', 'Savings', 'OD', 'CC', 'Loan', 'Other']).default('Current'),
        branch: z.string().optional(),
        ifsc: z.string().min(1, 'IFSC is required'),
        openingBalance: z.number().default(0),
    })
});

export const UpdateAccountSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Account ID is required'),
    }),
    body: z.object({
        bankName: z.string().optional(),
        accountType: z.enum(['Current', 'Savings', 'OD', 'CC', 'Loan', 'Other']).optional(),
        branch: z.string().optional(),
        ifsc: z.string().optional(),
        isActive: z.boolean().optional(),
    })
});

export const CreateTransferSchema = z.object({
    body: z.object({
        fromAccount: z.string().min(1, 'Source account is required'),
        toAccount: z.string().min(1, 'Destination account is required'),
        amount: z.number().positive('Amount must be positive'),
        description: z.string().optional(),
    })
});

export const CreateCashTransactionSchema = z.object({
    body: z.object({
        type: z.enum(['in', 'out']),
        amount: z.number().positive('Amount must be positive'),
        otherAccount: z.string().min(1, 'Other account is required'),
        description: z.string().optional(),
        reference: z.string().optional(),
        date: z.string().datetime().optional(),
    })
});

export const CreateChequeSchema = z.object({
    body: z.object({
        number: z.string().min(1, 'Cheque number is required'),
        payee: z.string().min(1, 'Payee is required'),
        amount: z.number().positive('Amount must be positive'),
        date: z.string().datetime().or(z.string().min(1)),
        bankName: z.string().optional(),
        type: z.enum(['RECEIVED', 'ISSUED']),
        accountId: z.string().min(1, 'Account ID is required'),
        sector: z.string().optional(),
        notes: z.string().optional(),
        forcePay: z.boolean().optional(),
    })
});

export const UpdateChequeStatusSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Cheque ID is required'),
    }),
    body: z.object({
        status: z.enum(['PENDING', 'CLEARED', 'BOUNCED', 'CANCELLED']),
    })
});

export const ValidatePaymentsSchema = z.object({
    body: z.object({
        accountId: z.string().min(1, 'Account ID is required'),
        payments: z.array(z.any()), // Assuming payments structure is loose for now
    })
});

export const BulkReconcileSchema = z.object({
    body: z.object({
        transactionIds: z.array(z.string()).min(1, 'At least one transaction ID is required'),
        reconciled: z.boolean(),
    })
});

export type CreateAccountDTO = z.infer<typeof CreateAccountSchema>['body'];
export type UpdateAccountDTO = z.infer<typeof UpdateAccountSchema>['body'];
export type CreateTransferDTO = z.infer<typeof CreateTransferSchema>['body'];
export type CreateCashTransactionDTO = z.infer<typeof CreateCashTransactionSchema>['body'];
export type CreateChequeDTO = z.infer<typeof CreateChequeSchema>['body'];
export type UpdateChequeStatusDTO = z.infer<typeof UpdateChequeStatusSchema>['body'];
export type ValidatePaymentsDTO = z.infer<typeof ValidatePaymentsSchema>['body'];
export type BulkReconcileDTO = z.infer<typeof BulkReconcileSchema>['body'];

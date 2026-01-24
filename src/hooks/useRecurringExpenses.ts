import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';

export interface RecurringExpenseMaster {
    id: string;
    tenant_id: string;
    branch_id: string;
    category_id: string;
    category_name: string;
    vendor: string;
    amount: number;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    start_date: string;
    next_due_date: string;
    auto_post: boolean;
    payment_mode: 'BANK' | 'CASH';
}

export interface PaymentHistory {
    id: string;
    recurring_id: string;
    payment_date: string;
    amount: number;
    status: 'PAID' | 'MISSED' | 'PARTIAL';
    bank_reference?: string;
}

export interface BranchFinancials {
    branch_id: string;
    branch_name: string;
    monthly_sales: number;
    gross_profit: number;
    net_profit: number;
}

export const useRecurringExpenses = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpenseMaster[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
    const [branchFinancials, setBranchFinancials] = useState<BranchFinancials[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            // In a real app, these would be separate table fetches
            // For now, we use high-grade mock data reflecting the user's requirements

            const mockRecurring: RecurringExpenseMaster[] = [
                {
                    id: 'R001',
                    tenant_id: user.tenantId,
                    branch_id: 'B001',
                    category_id: 'CAT_RENT',
                    category_name: 'Rent',
                    vendor: 'ABC Properties',
                    amount: 220000,
                    frequency: 'MONTHLY',
                    start_date: '2025-01-01',
                    next_due_date: '2026-01-05',
                    auto_post: true,
                    payment_mode: 'BANK'
                },
                {
                    id: 'R002',
                    tenant_id: user.tenantId,
                    branch_id: 'B001',
                    category_id: 'CAT_ELEC',
                    category_name: 'Electricity',
                    vendor: 'State Power Board',
                    amount: 45000,
                    frequency: 'MONTHLY',
                    start_date: '2025-01-01',
                    next_due_date: '2026-01-15',
                    auto_post: false,
                    payment_mode: 'BANK'
                },
                {
                    id: 'R003',
                    tenant_id: user.tenantId,
                    branch_id: 'B002',
                    category_id: 'CAT_RENT',
                    category_name: 'Rent',
                    vendor: 'City Real Estate',
                    amount: 180000,
                    frequency: 'MONTHLY',
                    start_date: '2025-01-01',
                    next_due_date: '2026-01-01',
                    auto_post: true,
                    payment_mode: 'BANK'
                },
                {
                    id: 'R004',
                    tenant_id: user.tenantId,
                    branch_id: 'B001',
                    category_id: 'CAT_INT',
                    category_name: 'Internet',
                    vendor: 'FiberX Corp',
                    amount: 5000,
                    frequency: 'MONTHLY',
                    start_date: '2025-01-01',
                    next_due_date: '2026-01-10',
                    auto_post: true,
                    payment_mode: 'BANK'
                }
            ];

            const mockHistory: PaymentHistory[] = [
                { id: 'H001', recurring_id: 'R001', payment_date: '2025-12-05', amount: 220000, status: 'PAID', bank_reference: 'TXN12345' },
                { id: 'H002', recurring_id: 'R003', payment_date: '2026-01-01', amount: 180000, status: 'MISSED' },
            ];

            const mockBranchFinancials: BranchFinancials[] = [
                { branch_id: 'B001', branch_name: 'Chennai', monthly_sales: 3200000, gross_profit: 800000, net_profit: 450000 },
                { branch_id: 'B002', branch_name: 'Coimbatore', monthly_sales: 1800000, gross_profit: 500000, net_profit: 200000 },
            ];

            setRecurringExpenses(mockRecurring);
            setPaymentHistory(mockHistory);
            setBranchFinancials(mockBranchFinancials);

        } catch (error: any) {
            console.error('Error fetching recurring expenses:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.tenantId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Intelligence Calculations
    const intelligence = useMemo(() => {
        const today = new Date();
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);

        const upcomingDues = recurringExpenses.map(rec => {
            const dueDate = new Date(rec.next_due_date);
            let status: 'DUE_SOON' | 'OVERDUE' | 'PAID' = 'DUE_SOON';

            if (dueDate < today) {
                const wasPaid = paymentHistory.some(h => h.recurring_id === rec.id && new Date(h.payment_date).getMonth() === dueDate.getMonth());
                status = wasPaid ? 'PAID' : 'OVERDUE';
            }

            return { ...rec, status };
        }).filter(d => d.status !== 'PAID');

        const cashRequired30Days = upcomingDues.reduce((sum, d) => sum + d.amount, 0);

        const summaryByBranch = branchFinancials.map(branch => {
            const branchExpenses = recurringExpenses
                .filter(rec => rec.branch_id === branch.branch_id)
                .reduce((sum, rec) => sum + rec.amount, 0);

            const costRatio = (branchExpenses / branch.monthly_sales) * 100;
            const riskLevel = costRatio > 15 || branch.net_profit < 0 ? 'HIGH' : costRatio > 10 ? 'MEDIUM' : 'LOW';

            return {
                branch_id: branch.branch_id,
                branch_name: branch.branch_name,
                total_monthly_fixed_cost: branchExpenses,
                monthly_sales: branch.monthly_sales,
                cost_ratio: `${Math.round(costRatio)}%`,
                risk_level: riskLevel as 'HIGH' | 'MEDIUM' | 'LOW',
                recommended_action: riskLevel === 'HIGH' ? 'Renegotiate rent or increase sales volume' : 'Maintain current efficiency'
            };
        });

        return {
            upcomingDues,
            cashRequired30Days,
            summaryByBranch
        };
    }, [recurringExpenses, paymentHistory, branchFinancials]);

    return {
        recurringExpenses,
        paymentHistory,
        branchFinancials,
        loading,
        intelligence,
        fetchData
    };
};

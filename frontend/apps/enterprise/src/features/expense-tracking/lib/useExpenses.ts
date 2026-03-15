import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import {
    getAllExpenses,
    createExpense as createExpenseThunk,
    updateExpense as updateExpenseThunk,
    deleteExpense as deleteExpenseThunk,
    Expense as ReduxExpense
} from "@/features/expense-tracking/model/expenseSlice";

export interface Expense {
    id: string;
    expense_number: string;
    date: string;
    amount: number;
    category: string;
    payment_method: string;
    description: string;
    branch_id: string;
    reference: string;
    tenant_id?: string; // For compatibility with intelligence views
}

// Transform backend expense to frontend format
const transformExpense = (exp: ReduxExpense): Expense => ({
    id: exp._id,
    expense_number: exp.expenseNo,
    date: exp.date,
    amount: exp.amount,
    category: exp.category,
    payment_method: (exp.paymentMethod || 'cash').toUpperCase(),
    description: exp.description || '',
    branch_id: exp.bankAccount || '',
    reference: '', // Reference not consistently in ReduxExpense yet
});

export const useExpenses = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { expenses: reduxExpenses, isLoading: loading, isError, message: error } = useSelector((state: RootState) => state.expense);
    const {  user  } = useAuthStore();

    const fetchExpenses = useCallback(() => {
        if (user) {
            dispatch(getAllExpenses());
        }
    }, [dispatch, user]);

    useEffect(() => {
        if (user && reduxExpenses.length === 0) {
            fetchExpenses();
        }
    }, [user, reduxExpenses.length, fetchExpenses]);

    const createExpense = async (data: Partial<Expense>) => {
        const backendData = {
            expenseNo: data.expense_number,
            date: data.date,
            amount: data.amount,
            category: data.category,
            paymentMethod: data.payment_method?.toLowerCase(),
            description: data.description,
            bankAccount: data.branch_id,
        };
        const resultAction = await dispatch(createExpenseThunk(backendData));
        if (createExpenseThunk.fulfilled.match(resultAction)) {
            return transformExpense(resultAction.payload);
        } else {
            throw new Error(resultAction.payload as string);
        }
    };

    const updateExpense = async (id: string, data: Partial<Expense>) => {
        const backendData = {
            expenseNo: data.expense_number,
            date: data.date,
            amount: data.amount,
            category: data.category,
            paymentMethod: data.payment_method?.toLowerCase(),
            description: data.description,
            bankAccount: data.branch_id,
        };
        const resultAction = await dispatch(updateExpenseThunk({ id, expenseData: backendData }));
        if (updateExpenseThunk.fulfilled.match(resultAction)) {
            return transformExpense(resultAction.payload);
        } else {
            throw new Error(resultAction.payload as string);
        }
    };

    const deleteExpense = async (id: string) => {
        const resultAction = await dispatch(deleteExpenseThunk(id));
        if (deleteExpenseThunk.rejected.match(resultAction)) {
            throw new Error(resultAction.payload as string);
        }
    };

    const expenses = reduxExpenses.map(transformExpense);

    return {
        expenses,
        loading,
        error: isError ? error : null,
        createExpense,
        updateExpense,
        deleteExpense,
        refetch: fetchExpenses
    };
};

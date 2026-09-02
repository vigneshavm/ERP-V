import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { setLaborPayments } from '../redux/slices/laborSlice';
import { LaborPayment } from "../types/hr";
import { getTable } from "../services/dataSource";

export const useHRData = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    // react-query rather than a plain useEffect + fetch: under
    // React.StrictMode (enabled in main.tsx) a plain effect's fetch body
    // runs twice on mount, firing a genuine duplicate network request each
    // time. react-query dedupes concurrent requests sharing a queryKey
    // against its cache instead, matching the pattern useFinanceSync.ts and
    // useTenantData.ts already use elsewhere in this codebase.
    const { data: lpData } = useQuery({
        queryKey: ['labor_payments', tenantId],
        queryFn: () => getTable('labor_payments', { filters: { tenant_id: tenantId } }),
        enabled: !!tenantId,
    });

    useEffect(() => {
        if (!lpData) return;
        const mappedLP = lpData.map((lp: any) => ({
            id: lp.id,
            employeeId: lp.employee_id,
            amount: lp.amount,
            date: lp.date,
            type: lp.type,
            note: lp.note
        })) as LaborPayment[];
        dispatch(setLaborPayments(mappedLP));
    }, [lpData, dispatch]);
};

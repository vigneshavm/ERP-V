import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setLaborPayments } from '../store/laborSlice';
import { LaborPayment } from '../types/hr';

export const useHRData = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!supabase || !tenantId) return;

        const fetchHRData = async () => {
            const { data: lpData, error: lpError } = await supabase.from('labor_payments').select('*').eq('tenant_id', tenantId);
            if (!lpError && lpData) {
                const mappedLP = lpData.map((lp: any) => ({
                    id: lp.id,
                    employeeId: lp.employee_id,
                    amount: lp.amount,
                    date: lp.date,
                    type: lp.type,
                    note: lp.note
                })) as LaborPayment[];
                dispatch(setLaborPayments(mappedLP));
            }
        };

        fetchHRData();
    }, [dispatch, tenantId]);
};

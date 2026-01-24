import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setLaborPayments } from '../store/laborSlice';
import { LaborPayment } from '../types/hr';
import { getTable } from '../services/dataSource';

export const useHRData = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!tenantId) return;

        const fetchHRData = async () => {
            const lpData = await getTable('labor_payments', { filters: { tenant_id: tenantId } });

            if (lpData) {
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

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

export const useExpenseReports = () => {
    const { user } = useSelector((state) => state.auth);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReport = async (startDate, endDate) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = '/expense-reports';
            if (startDate || endDate) {
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                url += `?${params.toString()}`;
            }
            const response = await api.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReport(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching expense reports:', err);
            setError(err.message);
            // Return empty report structure
            setReport({
                report_period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
                total_expense: 0,
                by_category: [],
                by_branch: [],
                by_payment_mode: [],
                audit_flags: [],
                recommendations: ['Add expenses to generate insights'],
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchReport();
        }
    }, [user]);

    return { report, loading, error, refetch: fetchReport };
};


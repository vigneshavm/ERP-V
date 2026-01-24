import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

export const useBranchResolver = () => {
    const { user } = useSelector((state) => state.auth);
    const [branches, setBranches] = useState([]);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const branchList = response.data?.branches || response.data || [];
            setBranches(branchList);
            if (branchList.length > 0) {
                setCurrentBranch(branchList[0]);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching branches:', err);
            setError(err.message);
            // Return mock data for development
            const mockBranches = [
                { id: 'B001', name: 'Main Branch', code: 'MAIN', address: '123 Main St', is_active: true },
                { id: 'B002', name: 'Chennai - OMR', code: 'CHN-OMR', address: 'OMR Road, Chennai', is_active: true },
                { id: 'B003', name: 'Coimbatore - RS Puram', code: 'CBE-RSP', address: 'RS Puram, Coimbatore', is_active: true },
                { id: 'B004', name: 'Bangalore - HSR', code: 'BLR-HSR', address: 'HSR Layout, Bangalore', is_active: true },
            ];
            setBranches(mockBranches);
            setCurrentBranch(mockBranches[0]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchBranches();
        }
    }, [user]);

    const resolveBranch = (branchId) => {
        return branches.find(b => b.id === branchId) || null;
    };

    const getBranchName = (branchId) => {
        const branch = resolveBranch(branchId);
        return branch?.name || branchId || 'Unknown Branch';
    };

    const selectBranch = (branchId) => {
        const branch = resolveBranch(branchId);
        if (branch) {
            setCurrentBranch(branch);
        }
    };

    return {
        branches,
        currentBranch,
        loading,
        error,
        resolveBranch,
        getBranchName,
        selectBranch,
        refetch: fetchBranches
    };
};

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from "../services/api.js";
import { RootState } from "../redux/store";

export interface Branch {
    id: string;
    name: string;
    code: string;
    address?: string;
    is_active: boolean;
}

interface AuthState {
    user: any; // Using any for user object to avoid deep typing of all user fields for now
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

export const useBranchResolver = () => {
    const { user } = useSelector((state: RootState & { auth: AuthState }) => state.auth);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const branchList: Branch[] = response.data?.branches || response.data || [];
            setBranches(branchList);
            if (branchList.length > 0) {
                setCurrentBranch(branchList[0]);
            }
            setError(null);
        } catch (err: any) {
            console.error('Error fetching branches:', err);
            setError(err.message);
            // Return mock data for development
            const mockBranches: Branch[] = [
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

    const resolveBranch = (branchId: string): Branch | null => {
        return branches.find(b => b.id === branchId) || null;
    };

    const getBranchName = (branchId: string | undefined | null): string => {
        if (!branchId) return 'Main Branch';
        const branch = resolveBranch(branchId);
        return branch?.name || branchId || 'Unknown Branch';
    };

    const selectBranch = (branchId: string) => {
        const branch = resolveBranch(branchId);
        if (branch) {
            setCurrentBranch(branch);
        }
    };

    return {
        branches,
        currentBranch,
        currentBranchId: currentBranch?.id || null,
        loading,
        error,
        resolveBranch,
        getBranchName,
        selectBranch,
        refetch: fetchBranches
    };
};

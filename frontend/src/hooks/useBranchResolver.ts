import { useState, useEffect, useRef } from 'react';
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

// Module-level cache to prevent multiple fetches across component instances
let branchCache: Branch[] | null = null;
let fetchPromise: Promise<Branch[]> | null = null;

export const useBranchResolver = () => {
    const { user } = useSelector((state: RootState & { auth: AuthState }) => state.auth);
    const [branches, setBranches] = useState<Branch[]>(branchCache || []);
    const [currentBranch, setCurrentBranch] = useState<Branch | null>(branchCache?.[0] || null);
    const [loading, setLoading] = useState<boolean>(!branchCache);
    const [error, setError] = useState<string | null>(null);
    const hasFetched = useRef(false);

    const fetchBranches = async (): Promise<Branch[]> => {
        // If already cached, return immediately
        if (branchCache) {
            return branchCache;
        }

        // If a fetch is in progress, wait for it
        if (fetchPromise) {
            return fetchPromise;
        }

        // Start new fetch
        fetchPromise = (async () => {
            try {
                setLoading(true);
                // Token is handled automatically by api interceptor
                const response = await api.get('/api/branches');
                const branchList: Branch[] = response.data?.branches || response.data || [];
                branchCache = branchList;
                setBranches(branchList);
                if (branchList.length > 0) {
                    setCurrentBranch(branchList[0]);
                }
                setError(null);
                return branchList;
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
                branchCache = mockBranches;
                setBranches(mockBranches);
                setCurrentBranch(mockBranches[0]);
                return mockBranches;
            } finally {
                setLoading(false);
                fetchPromise = null;
            }
        })();

        return fetchPromise;
    };

    useEffect(() => {
        if (user && !hasFetched.current && !branchCache) {
            hasFetched.current = true;
            fetchBranches();
        } else if (branchCache && branches.length === 0) {
            // Use cached data
            setBranches(branchCache);
            setCurrentBranch(branchCache[0] || null);
            setLoading(false);
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

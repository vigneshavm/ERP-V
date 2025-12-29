import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';


export const useBranchResolver = () => {
    const { tenants, branches } = useSelector((state: RootState) => state.tenant);

    const getBranchName = useCallback((branchId: string | undefined): string => {
        if (!branchId) return 'Unknown Branch';
        if (branchId === 'All') return 'All Branches';

        // 1. Try to find in any tenant
        for (const tenant of tenants) {
            for (const loc of tenant.locations) {
                const branch = loc.branches.find(b => b.id === branchId);
                if (branch) return branch.name;
            }
        }

        // 2. Fallback to DB branches list
        const dbBranch = branches.find(b => b.id === branchId || b.name === branchId);
        if (dbBranch) return dbBranch.name;



        return branchId; // Return ID if no name found
    }, [tenants]);

    return { getBranchName };
};

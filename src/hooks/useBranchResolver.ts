import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';


export const useBranchResolver = () => {
    const { tenants, branches } = useSelector((state: RootState) => state.tenant);

    const currentBranchId = useSelector((state: RootState) => state.auth.currentBranch);

    const getBranchName = useCallback((branchId: string | undefined): string => {
        if (!branchId) {
            // If there's only one known branch across tenants or DB, return its name instead of Unknown
            const tenantBranches = tenants.flatMap(t => t.locations?.flatMap(l => l.branches) || []);
            if (tenantBranches.length === 1) return tenantBranches[0].name;
            if (branches && branches.length === 1) return branches[0].name;
            return 'Unknown Branch';
        }
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
    }, [tenants, branches]);

    return { getBranchName, currentBranchId };
};

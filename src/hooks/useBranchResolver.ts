import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { MOCK_BRANCHES } from '../../mockData';

export const useBranchResolver = () => {
    const { tenants } = useSelector((state: RootState) => state.tenant);

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

        // 2. Fallback to MOCK_BRANCHES (legacy/simple mocks)
        // Check by name first (since some mocks used name as ID)
        const mockByName = MOCK_BRANCHES.find(b => b.name === branchId);
        if (mockByName) return mockByName.name;

        // If MOCK_BRANCHES had IDs, we'd check that too, but currently they only have names 
        // effectively acting as IDs in the old mock setup.

        return branchId; // Return ID if no name found
    }, [tenants]);

    return { getBranchName };
};

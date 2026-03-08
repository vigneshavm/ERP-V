import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';

export const useBranchResolver = () => {
    const currentBranchId = useSelector((state: RootState) => state.auth.currentBranch) || 'All';
    const branches = useSelector((state: RootState) => state.tenant.branches) || [];

    const getBranchName = (id: string) => {
        if (id === 'All') return 'All Branches';
        const branch = branches.find((b: any) => b.id === id);
        return branch ? branch.name : 'Unknown Branch';
    };

    return { currentBranchId, getBranchName, branches };
};

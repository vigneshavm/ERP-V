import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { AppView } from '../types/common';
import { DbRoleCode } from '../types/tenant';

export const usePermissions = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { rolePermissions } = useSelector((state: RootState) => state.settings);

    const checkAccess = (view: AppView): boolean => {
        if (!user) return false;

        const effectiveRoleCode = (user.systemRole as string).toLowerCase() as DbRoleCode;
        const allowedViews = rolePermissions[effectiveRoleCode] || [];
        return allowedViews.includes(view);
    };

    return { checkAccess, user };
};

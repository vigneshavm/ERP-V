import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { AppView, ModuleType } from '@repo/shared-kernel';

export const usePermissions = () => {
    const { user, role } = useSelector((state: RootState) => state.auth);
    
    // In a real app, this would check against a permissions map
    // For now, we'll use some basic logic
    
    const checkAccess = (viewId: AppView | string): boolean => {
        if (!user) return false;
        if (role === 'Owner' || role === 'Admin' || user.email === 'avmvignesh0207@gmail.com') return true;
        
        // Add specific view access logic here
        return true; 
    };

    const checkModuleAccess = (module: ModuleType | string | undefined): boolean => {
        if (!user) return false;
        if (role === 'Owner' || role === 'Admin' || user.email === 'avmvignesh0207@gmail.com') return true;
        if (!module) return true;
        
        // Add specific module access logic here
        return true;
    };

    return { checkAccess, checkModuleAccess };
};

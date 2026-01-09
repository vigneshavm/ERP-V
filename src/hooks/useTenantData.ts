import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { APP_CONFIG } from '../config';
import { setTenants, setBranches, setEmployees, setUser } from '../store';
import { TenantUser } from '../types/tenant';
import { useTenantDataMappers } from './useTenantDataMappers';
import { fetchTenantsRaw, fetchBranchesRaw, fetchEmployeesRaw } from './tenantQueries';

export const useTenantData = (user: any) => {
    const dispatch = useDispatch();
    const { mapTenant, mapBranch, mapEmployee } = useTenantDataMappers();

    // 1. Fetch Tenants
    const { data: rawTenants } = useQuery({
        queryKey: ['tenants'],
        queryFn: fetchTenantsRaw,
        enabled: APP_CONFIG.USE_SUPABASE
    });

    const allTenants = rawTenants?.map(mapTenant) || [];

    const isolatedTenantId = (() => {
        if (APP_CONFIG.REQUIRE_TENANT_ID && APP_CONFIG.DEPLOY_TENANT_ID) {
            const exists = allTenants.find(t => t.id === APP_CONFIG.DEPLOY_TENANT_ID);
            if (exists) return APP_CONFIG.DEPLOY_TENANT_ID;
        }
        return null;
    })();

    // 2. Fetch Branches
    const { data: rawBranches } = useQuery({
        queryKey: ['branches', isolatedTenantId],
        queryFn: () => fetchBranchesRaw(isolatedTenantId),
        enabled: APP_CONFIG.USE_SUPABASE && !!rawTenants
    });

    // 3. Fetch Employees
    const { data: rawEmployees } = useQuery({
        queryKey: ['employees', isolatedTenantId],
        queryFn: () => fetchEmployeesRaw(isolatedTenantId),
        enabled: APP_CONFIG.USE_SUPABASE && !!rawTenants
    });

    // 4. Sync to Redux (Bridge)
    useEffect(() => {
        if (!rawTenants) return;

        const mappedBranches = rawBranches ? rawBranches.map((b: any) => mapBranch(b, allTenants)) : [];

        const reconciledTenants = allTenants.map(t => {
            const tenantBranches = rawBranches?.filter((b: any) => b.tenant_id === t.id) || [];
            const updatedLocations = (t.locations || []).map((loc: any) => ({
                ...loc,
                branches: (loc.branches || []).map((b: any) => {
                    if (b.id && b.id.toString().startsWith('BR-')) {
                        const realBranch = tenantBranches.find((rb: any) => rb.name === b.name);
                        if (realBranch) return { ...b, id: realBranch.id };
                    }
                    return b;
                })
            }));
            return { ...t, locations: updatedLocations };
        });

        const finalTenants = isolatedTenantId
            ? reconciledTenants.filter(t => t.id === isolatedTenantId)
            : reconciledTenants;

        dispatch(setTenants(finalTenants));
        dispatch(setBranches(mappedBranches));
    }, [rawTenants, rawBranches, isolatedTenantId, dispatch]);

    useEffect(() => {
        if (!rawEmployees) return;

        const mappedEmployees = rawEmployees.map(mapEmployee);
        dispatch(setEmployees(mappedEmployees));

        if (user && user.id) {
            const currentUserInList = mappedEmployees.find(me => me.id === user.id);
            if (currentUserInList && currentUserInList.branchId !== user.branchId) {
                const updatedUser: TenantUser = {
                    ...user,
                    id: currentUserInList.id,
                    fullName: currentUserInList.name,
                    name: currentUserInList.name,
                    mobile: currentUserInList.mobile,
                    role: currentUserInList.role,
                    systemRole: currentUserInList.systemRole as any,
                    branchId: currentUserInList.branchId as any,
                    roleId: currentUserInList.roleId
                };
                dispatch(setUser(updatedUser));
            }
        }
    }, [rawEmployees, user?.id, dispatch]);
};

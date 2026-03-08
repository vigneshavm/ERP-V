import { useMemo, useState, useEffect } from 'react';
import { Supplier, TaxBreakdown } from "@vignesh-erp/shared-kernel";
import api from "@/shared/api/api";

export const useTaxIntelligence = (supplier: Supplier | null, totalTax: number) => {
    const [tenantState, setTenantState] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get('/api/business/profile');
                if (data.success && data.data.tenantAddress?.state) {
                    setTenantState(data.data.tenantAddress.state);
                }
            } catch (err) {
                console.error("Failed to fetch business profile for tax intelligence", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const breakdown = useMemo((): TaxBreakdown => {
        if (!supplier) return { cgst: 0, sgst: 0, igst: 0, vat: 0 };

        // Determine if Inter-state (IGST) or Intra-state (CGST+SGST)
        // Default to IGST if states are different or tenant state is unknown
        const supplierState = supplier.businessAddress?.state;
        const isInterState = !tenantState || !supplierState || tenantState.toLowerCase() !== supplierState.toLowerCase();

        if (isInterState) {
            return {
                cgst: 0,
                sgst: 0,
                igst: totalTax,
                vat: 0
            };
        } else {
            return {
                cgst: totalTax / 2,
                sgst: totalTax / 2,
                igst: 0,
                vat: 0
            };
        }
    }, [supplier, tenantState, totalTax]);

    return {
        breakdown,
        isInterState: !tenantState || !supplier?.businessAddress?.state || tenantState.toLowerCase() !== supplier.businessAddress.state.toLowerCase(),
        tenantState,
        isLoading
    };
};

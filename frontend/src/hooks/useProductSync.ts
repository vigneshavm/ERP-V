import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
// import { supabase } from '../lib/supabase'; // Removed
import { setProducts, setCategories, setHydrating } from '../redux/slices/inventorySlice';
import { Product } from "../types/product";
import { SyncManager } from "../services/SyncManager";
import { getTable } from "../services/dataSource";
import { setSyncing } from '../redux/slices/uiSlice';

export const useProductSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    // 1. Immediate Hydration (SWR) from the offline cache -- independent of
    // the network fetch below, so it still shows something instantly even
    // before/without a network round trip.
    useEffect(() => {
        if (!tenantId) return;
        let cancelled = false;
        SyncManager.getOfflineProducts(tenantId).then(cached => {
            if (!cancelled && cached && cached.length > 0) {
                dispatch(setProducts(cached));
            }
        });
        return () => { cancelled = true; };
    }, [tenantId, dispatch]);

    // 2. Parallelized Background Fetch (Switches between DEMO/DB), via
    // react-query rather than a plain useEffect + fetch: under
    // React.StrictMode (enabled in main.tsx) a plain effect's fetch body
    // runs twice on mount, firing a genuine duplicate network request each
    // time. react-query dedupes concurrent requests sharing a queryKey
    // against its cache instead, matching the pattern useFinanceSync.ts and
    // useTenantData.ts already use elsewhere in this codebase.
    const {
        data: prodData,
        isFetching: isFetchingProducts,
        isFetched: isFetchedProducts,
    } = useQuery({
        queryKey: ['products', tenantId],
        queryFn: () => getTable('products', { filters: { tenant_id: tenantId } }),
        enabled: !!tenantId,
    });

    const {
        data: catData,
        isFetching: isFetchingCategories,
        isFetched: isFetchedCategories,
    } = useQuery({
        queryKey: ['cloth_product_master', tenantId],
        queryFn: () => getTable('cloth_product_master', { filters: { tenant_id: tenantId } }),
        enabled: !!tenantId,
    });

    useEffect(() => {
        dispatch(setSyncing(isFetchingProducts || isFetchingCategories));
    }, [isFetchingProducts, isFetchingCategories, dispatch]);

    // Matches the original Promise.all + finally: clear "hydrating" only
    // once both queries have settled (success or error), not just the
    // first one to resolve.
    useEffect(() => {
        if (isFetchedProducts && isFetchedCategories) {
            dispatch(setHydrating(false));
        }
    }, [isFetchedProducts, isFetchedCategories, dispatch]);

    // 3. Process Products
    useEffect(() => {
        if (!prodData) return;
        const mappedProducts = prodData.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            nameTamil: p.nameTamil || p.pNameTamil || p.name_tamil,
            category: p.category || 'General',
            subCategory: p.subCategory || p.sub_category,
            sellingPrice: p.sellingPrice ?? p.price ?? p.selling_price ?? 0,
            mrp: p.mrp,
            costPrice: p.costPrice ?? p.cost ?? 0,
            stockQty: p.stockQty ?? p.stock ?? 0,
            sector: p.sector,
            branchId: p.branchId || p.branch_id,
            productType: p.productType || p.product_type || 'General',
            barcode: p.barcode,
            brand: p.brand,
            hsnCode: p.hsnCode || p.hsn_code,
            gstPercentage: p.gstPercentage || p.gst_percentage || p.gst_rate || 18,
            unit: p.unit || 'Piece',
            tenantId: p.tenantId || p.tenant_id,
            image: p.image,
            description: p.description,
            discount: p.discount || 0
        })) as Product[];
        dispatch(setProducts(mappedProducts));
        SyncManager.cacheProducts(mappedProducts);
    }, [prodData, dispatch]);

    // 4. Process Categories
    useEffect(() => {
        if (!catData) return;
        const uniqueCategories = Array.from(new Set(catData.map((c: any) => c.product_name || c.category).filter(Boolean)));
        dispatch(setCategories(uniqueCategories as string[]));
    }, [catData, dispatch]);
};

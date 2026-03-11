import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
// import { supabase } from '../lib/supabase'; // Removed
import { setProducts, setCategories, setHydrating } from '@/entities/inventory/model/inventorySlice';
import { Product } from "@repo/shared"; 
import { SyncManager } from "./SyncManager";
import { getTable } from "@/shared/api/dataSource";
import { useUiStore } from '@/shared/lib/store/uiStore';

export const useProductSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!tenantId) return;

        const fetchProducts = async () => {
            const setSyncStatus = useUiStore.getState().setSyncing;
        setSyncStatus(true);
            try {
                // 1. Immediate Hydration (SWR) - only if DB mode
                const cached = await SyncManager.getOfflineProducts(tenantId);
                if (cached && cached.length > 0) {
                    dispatch(setProducts(cached));
                }

                // 2. Parallelized Background Fetch (Switches between DEMO/DB)
                const [prodData, catData] = await Promise.all([
                    getTable('products', { filters: { tenant_id: tenantId } }),
                    getTable('cloth_product_master', { filters: { tenant_id: tenantId } })
                ]);

                // 3. Process Products
                if (prodData) {
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
                }

                // 4. Process Categories
                if (catData) {
                    const uniqueCategories = Array.from(new Set(catData.map((c: any) => c.product_name || c.category).filter(Boolean)));
                    dispatch(setCategories(uniqueCategories as string[]));
                }
            } catch (err) {
                console.error("Failed to sync products:", err);
            } finally {
                dispatch(setHydrating(false));
                const setSyncStatus = useUiStore.getState().setSyncing;
            setSyncStatus(false);
            }
        };

        fetchProducts();

        return () => {
            // Cleanup
        };
    }, [dispatch, tenantId]);
};


import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setProducts, upsertProduct, setCategories, setHydrating } from '../store/inventorySlice';
import { Product } from '../types/product';
import { SyncManager } from '../services/SyncManager';
import { getTable, DATA_MODE } from '../services/dataSource';
import { setSyncing } from '../store/uiSlice';

export const useProductSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!tenantId) return;

        const fetchProducts = async () => {
            dispatch(setSyncing(true));
            try {
                // 1. Immediate Hydration (SWR) - only if DB mode
                if (DATA_MODE === 'DB') {
                    const cached = await SyncManager.getOfflineProducts(tenantId);
                    if (cached && cached.length > 0) {
                        dispatch(setProducts(cached));
                    }
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
                        category: p.category,
                        subCategory: p.sub_category || p.subCategory,
                        price: p.price,
                        mrp: p.mrp,
                        cost: p.cost,
                        stock: p.stock,
                        sector: p.sector,
                        branchId: p.branch_id,
                        productType: p.product_type,
                        barcode: p.barcode,
                        brand: p.brand,
                        hsnCode: p.hsn_code,
                        gstPercentage: p.gst_percentage,
                        composition: p.composition,
                        unit: p.unit,
                        tenantId: p.tenant_id,
                        lastRestocked: p.last_restocked,
                        expiryDate: p.expiry_date,
                        image: p.image,
                        description: p.description,
                        size: p.size,
                        color: p.color,
                        material: p.material,
                        location: p.location,
                        discount: p.discount || 0
                    })) as Product[];
                    dispatch(setProducts(mappedProducts));
                    if (DATA_MODE === 'DB') SyncManager.cacheProducts(mappedProducts);
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
                dispatch(setSyncing(false));
            }
        };

        fetchProducts();

        // Real-time - Only enabled in DB mode
        let productChannel: any;
        if (DATA_MODE === 'DB' && supabase) {
            productChannel = supabase
                .channel('public:products')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                    filter: `tenant_id=eq.${tenantId}`
                }, (payload) => {
                    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                        const p = payload.new;
                        const mappedProduct: Product = {
                            id: p.id,
                            sku: p.sku,
                            name: p.name,
                            category: p.category,
                            price: p.price,
                            cost: p.cost,
                            stock: p.stock,
                            sector: p.sector,
                            branchId: p.branch_id,
                            productType: p.product_type,
                            barcode: p.barcode,
                            brand: p.brand,
                            hsnCode: p.hsn_code,
                            gstPercentage: p.gst_percentage,
                            composition: p.composition,
                            unit: p.unit,
                            tenantId: p.tenant_id,
                            lastRestocked: p.last_restocked,
                            expiryDate: p.expiry_date
                        };
                        dispatch(upsertProduct(mappedProduct));
                    }
                })
                .subscribe();
        }

        return () => {
            if (productChannel && supabase) {
                supabase.removeChannel(productChannel);
            }
        };
    }, [dispatch, tenantId]);
};

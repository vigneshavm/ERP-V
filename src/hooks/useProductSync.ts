import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setProducts, upsertProduct, setCategories } from '../store/inventorySlice';
import { Product } from '../types/product';
import { SyncManager } from '../services/SyncManager';

export const useProductSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!supabase || !tenantId) return;

        const fetchProducts = async () => {
            let pQuery = supabase.from('products').select('*').eq('tenant_id', tenantId);
            const { data: productsData, error: prodError } = await pQuery;

            if (prodError && !navigator.onLine) {
                const offlineProducts = await SyncManager.getOfflineProducts();
                dispatch(setProducts(offlineProducts));
            } else if (!prodError && productsData) {
                const mappedProducts = productsData.map((p: any) => ({
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
                SyncManager.cacheProducts(mappedProducts);
            }

            // Categories
            let catQuery = supabase.from('cloth_product_master').select('*').eq('tenant_id', tenantId);
            const { data: catData, error: catError } = await catQuery;
            if (!catError && catData) {
                const uniqueCategories = Array.from(new Set(catData.map((c: any) => c.product_name).filter(Boolean)));
                dispatch(setCategories(uniqueCategories as string[]));
            }
        };

        fetchProducts();

        // Real-time
        const productChannel = supabase
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

        return () => {
            supabase.removeChannel(productChannel);
        };
    }, [dispatch, tenantId]);
};

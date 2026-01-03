import { APP_CONFIG } from '../config';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setBranches, setUser, setTenants } from '../store/tenantSlice';
import { setProducts, upsertProduct } from '../store/inventorySlice';
import { setCustomersList, setSalesHistory } from '../store/posSlice';
import { setEmployees, setLaborPayments } from '../store/laborSlice';
import { setTransactions, setCheques } from '../store/financeSlice';
import { setOrders } from '../store/purchaseSlice';
import { RootState } from '../store';
import { Tenant } from '../types/tenant';
import { Product } from '../types/product';
import { Sale, Customer } from '../types/sales';
import { Employee, LaborPayment } from '../types/hr';
import { Transaction, Cheque } from '../types/finance';
import { PurchaseOrder } from '../types/purchase';
import { SyncManager } from '../services/SyncManager';

export const useSupabaseData = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants, branches } = useSelector((state: RootState) => state.tenant);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Global Tenants (Always needed for login)
    useEffect(() => {
        if (!APP_CONFIG.USE_SUPABASE) {
            console.log('Supabase integration disabled. Using mock data.');
            return;
        }

        const fetchTenants = async () => {
            if (!supabase) {
                console.error('Supabase client not initialized. Check your environment variables.');
                return;
            }
            try {
                // Fetch ALL tenants first to check for validity and support "common" mode
                const { data, error } = await supabase.from('tenants').select('*');

                if (error) throw error;

                if (data) {
                    const allTenants = data.map((t: any) => ({
                        // ... existing mapping logic
                        id: t.id,
                        name: t.name,
                        subdomain: t.subdomain,
                        modules: t.modules || [],
                        isActive: t.is_active ?? true,
                        region: t.region || { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' },
                        sector: t.sector,
                        theme: t.theme || 'light',
                        layout: t.layout || 'standard',
                        domain: t.domain,
                        primaryColor: t.primary_color,
                        locations: t.locations || [],
                        loginLogoUrl: t.login_logo_url,
                        loginBgUrl: t.login_bg_url,
                        updatedAt: t.updated_at || t.updatedAt
                    })) as Tenant[];

                    // Determine if we are isolating
                    let isolatedTenantId: string | null = null;
                    if (APP_CONFIG.REQUIRE_TENANT_ID && APP_CONFIG.DEPLOY_TENANT_ID) {
                        const exists = allTenants.find(t => t.id === APP_CONFIG.DEPLOY_TENANT_ID);
                        if (exists) {
                            isolatedTenantId = APP_CONFIG.DEPLOY_TENANT_ID;
                        }
                    }

                    // Fetch Branches (Filter if isolated)
                    let bQuery = supabase.from('branches').select('*');
                    if (isolatedTenantId) {
                        bQuery = bQuery.eq('tenant_id', isolatedTenantId);
                    }
                    const { data: branchData, error: bErr } = await bQuery;
                    if (bErr) throw bErr;

                    const mappedBranches = branchData ? branchData.map((b: any) => {
                        const t = allTenants.find(ten => ten.id === b.tenant_id);
                        return {
                            id: b.id,
                            tenantId: b.tenant_id,
                            name: b.name,
                            city: b.city,
                            address: b.address,
                            sector: t?.sector || 'General',
                            updatedAt: b.updated_at || b.updatedAt
                        };
                    }) : [];

                    // --- RECONCILIATION LOGIC ---
                    // Sync temporary BR- IDs in tenants locations with actual branch UUIDs
                    const reconciledTenants = allTenants.map(t => {
                        const tenantBranches = branchData?.filter((b: any) => b.tenant_id === t.id) || [];
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

                    // If isolating and found, show only that tenant. Otherwise show all (common mode).
                    const finalTenants = isolatedTenantId
                        ? reconciledTenants.filter(t => t.id === isolatedTenantId)
                        : reconciledTenants;

                    dispatch(setTenants(finalTenants));
                    dispatch(setBranches(mappedBranches));

                    // --- Fetch Employees (Critical for Login) ---
                    let eQuery = supabase.from('employees').select('*');
                    if (isolatedTenantId) {
                        eQuery = eQuery.eq('tenant_id', isolatedTenantId);
                    }
                    const { data: empData, error: empErr } = await eQuery;
                    if (empErr) throw empErr;

                    if (empData) {
                        const mappedEmployees = empData.map((e: any) => {
                            let bId = e.branch_id;
                            // Repair branchId if it holds a temporary BR- ID
                            if (bId && bId.toString().startsWith('BR-')) {
                                const tenant = allTenants.find(t => t.id === e.tenant_id);
                                const tempBranchEntry = tenant?.locations?.flatMap((l: any) => l.branches || []).find((b: any) => b.id === bId);
                                if (tempBranchEntry) {
                                    const realBranch = branchData?.find((rb: any) => rb.tenant_id === e.tenant_id && rb.name === tempBranchEntry.name);
                                    if (realBranch) bId = realBranch.id;
                                }
                            }

                            return {
                                id: e.id,
                                name: e.name,
                                role: e.role,
                                systemRole: e.system_role,
                                pin: e.pin,
                                dailyRate: e.daily_rate,
                                sector: e.sector,
                                branchId: bId,
                                tenantId: e.tenant_id,
                                phoneNumber: e.phone_number
                            };
                        }) as Employee[];

                        dispatch(setEmployees(mappedEmployees));

                        // Auto-Repair current session user branchId if it's lagging with temporary ID
                        if (user && user.id) {
                            const currentUserInList = mappedEmployees.find(me => me.id === user.id);
                            if (currentUserInList && currentUserInList.branchId !== user.branchId) {
                                console.log(`[Repair] Updating session branchId for ${user.name}: ${user.branchId} -> ${currentUserInList.branchId}`);
                                dispatch(setUser(currentUserInList));
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching tenants:', error);
            }
        };

        fetchTenants();
    }, [dispatch]);

    // 2. Fetch Tenant Specific Data (Products, Customers, Sales) - On Login
    useEffect(() => {
        if (!APP_CONFIG.USE_SUPABASE) return;
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!supabase) return;

                const tId = user.tenantId;

                // Sync background data if online
                if (navigator.onLine) {
                    SyncManager.syncOfflineSales().catch(err => console.error('Background sync failed:', err));
                }

                // Products
                let pQuery = supabase.from('products').select('*');
                if (tId) pQuery = pQuery.eq('tenant_id', tId);

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

                // Customers
                let cQuery = supabase.from('customers').select('*');
                if (tId) cQuery = cQuery.eq('tenant_id', tId);
                const { data: custData, error: custError } = await cQuery;
                if (custError && !navigator.onLine) {
                    const offlineCustomers = await SyncManager.getOfflineCustomers();
                    dispatch(setCustomersList(offlineCustomers));
                } else if (!custError && custData) {
                    dispatch(setCustomersList(custData as Customer[]));
                    SyncManager.cacheCustomers(custData as Customer[]);
                }

                // Labor Payments
                let lpQuery = supabase.from('labor_payments').select('*');
                if (tId) lpQuery = lpQuery.eq('tenant_id', tId);
                const { data: lpData, error: lpError } = await lpQuery;
                if (lpError) throw lpError;
                if (lpData) {
                    const mappedLP = lpData.map((lp: any) => ({
                        id: lp.id,
                        employeeId: lp.employee_id,
                        amount: lp.amount,
                        date: lp.date,
                        type: lp.type,
                        note: lp.note
                    })) as LaborPayment[];
                    dispatch(setLaborPayments(mappedLP));
                }

                // Sales
                let sQuery = supabase.from('sales').select('*');
                if (tId) sQuery = sQuery.eq('tenant_id', tId);
                const { data: salesData, error: salesError } = await sQuery.limit(100);
                if (salesError) throw salesError;
                if (salesData) {
                    const mappedSales = salesData.map((s: any) => ({
                        id: s.id,
                        date: s.date,
                        items: s.items || [],
                        total: s.total,
                        customerId: s.customer_id,
                        sector: s.sector,
                        branchId: s.branch_id,
                        taxMode: s.tax_mode,
                        paymentMethod: s.payment_method,
                        status: s.status || 'COMPLETED',
                        paymentStatus: s.payment_status || 'PAID'
                    })) as Sale[];
                    dispatch(setSalesHistory(mappedSales));
                }

                // Transactions
                let txQuery = supabase.from('transactions').select('*');
                if (tId) txQuery = txQuery.eq('tenant_id', tId);
                const { data: txData, error: txError } = await txQuery;
                if (txError) throw txError;
                if (txData) {
                    const mappedTx = txData.map((t: any) => ({
                        id: t.id,
                        type: t.type,
                        category: t.category,
                        amount: t.amount,
                        date: t.date,
                        description: t.description,
                        sector: t.sector,
                        branchId: t.branch_id,
                        tenantId: t.tenant_id
                    })) as Transaction[];
                    dispatch(setTransactions(mappedTx));
                }

                // Cheques
                let cqQuery = supabase.from('cheques').select('*');
                if (tId) cqQuery = cqQuery.eq('tenant_id', tId);
                const { data: chequeData, error: chequeError } = await cqQuery;
                if (chequeError) throw chequeError;
                if (chequeData) {
                    const mappedCheques = chequeData.map((c: any) => ({
                        id: c.id,
                        number: c.number,
                        bankName: c.bank_name,
                        payee: c.payee,
                        amount: c.amount,
                        date: c.date,
                        status: c.status,
                        type: c.type,
                        sector: c.sector,
                        tenantId: c.tenant_id
                    })) as Cheque[];
                    dispatch(setCheques(mappedCheques));
                }

                // Purchase Orders
                let poQuery = supabase.from('purchase_orders').select('*');
                if (tId) poQuery = poQuery.eq('tenant_id', tId);
                const { data: poData, error: poError } = await poQuery;
                if (poError) throw poError;
                if (poData) {
                    const mappedPO = poData.map((po: any) => ({
                        id: po.id,
                        vendor: po.vendor,
                        date: po.date,
                        status: po.status,
                        total: po.total,
                        items: po.items || [],
                        sector: po.sector,
                        branchId: po.branch_id,
                        tenantId: po.tenant_id
                    })) as PurchaseOrder[];
                    dispatch(setOrders(mappedPO));
                }

            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // 3. Real-time Subscription for Products (Central Stock Sync)
        const tenantId = user.tenantId;
        const productChannel = supabase
            .channel('public:products')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'products',
                filter: tenantId ? `tenant_id=eq.${tenantId}` : undefined
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
    }, [dispatch, user, branches, tenants]);

    return { loading, error };
};

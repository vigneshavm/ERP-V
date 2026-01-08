import { APP_CONFIG } from '../config';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setBranches, setUser, setTenants, setUserPreferences } from '../store/tenantSlice';
import { setProducts, upsertProduct, setCategories } from '../store/inventorySlice';
import { setCustomersList, setSalesHistory } from '../store/posSlice';
import { setEmployees, setLaborPayments } from '../store/laborSlice';
import { setTransactions, setCheques, setDailyRecords } from '../store/financeSlice';
import { setOrders } from '../store/purchaseSlice';
import { RootState } from '../store';
import { Tenant, DbRoleCode, TenantUser } from '../types/tenant';
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
                // Fetch ALL tenants with related detail tables using joins
                const { data, error } = await supabase.from('tenants').select(`
                    *,
                    tenant_business_info (*),
                    tenant_company_details (*),
                    tenant_tax_details (*),
                    tenant_banking_details (*),
                    tenant_system_config (*),
                    tenant_integrations (*),
                    tenant_active_modules (
                        system_modules (
                            code
                        )
                    )
                `);

                if (error) throw error;

                if (data) {
                    const allTenants = data.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        subdomain: t.subdomain,
                        modules: (t.tenant_active_modules || []).map((tam: any) =>
                            Array.isArray(tam.system_modules) ? tam.system_modules[0]?.code : tam.system_modules?.code
                        ).filter(Boolean),
                        isActive: t.is_active ?? true,
                        region: t.region || { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' },
                        sector: t.sector,
                        layout: t.layout || 'standard',
                        domain: t.domain,
                        locations: t.locations || [],

                        // Map from joined tables
                        // Map from joined tables
                        // PostgREST might return an array for joins, even if 1-to-1
                        businessType: Array.isArray(t.tenant_business_info) ? t.tenant_business_info[0]?.business_type : t.tenant_business_info?.business_type,
                        natureOfBusiness: Array.isArray(t.tenant_business_info) ? t.tenant_business_info[0]?.nature_of_business : t.tenant_business_info?.nature_of_business,
                        tradeDescription: Array.isArray(t.tenant_business_info) ? t.tenant_business_info[0]?.trade_description : t.tenant_business_info?.trade_description,

                        companyDetails: (() => {
                            const details = Array.isArray(t.tenant_company_details) ? t.tenant_company_details[0] : t.tenant_company_details;
                            return details ? {
                                addressLine1: details.address_line1,
                                addressLine2: details.address_line2,
                                city: details.city,
                                state: details.state,
                                stateCode: details.state_code,
                                country: details.country,
                                pincode: details.pincode,
                                phone: details.phone,
                                alternatePhone: details.alternate_phone,
                                email: details.email,
                                website: details.website
                            } : undefined;
                        })(),

                        taxDetails: (() => {
                            const tax = Array.isArray(t.tenant_tax_details) ? t.tenant_tax_details[0] : t.tenant_tax_details;
                            return tax ? {
                                taxSystem: tax.tax_system,
                                gstin: tax.gstin,
                                pan: tax.pan,
                                isGstEnabled: tax.is_gst_enabled,
                                isEInvoiceEnabled: tax.is_einvoice_enabled,
                                isEWayBillEnabled: tax.is_eway_bill_enabled
                            } : undefined;
                        })(),

                        bankingDetails: (() => {
                            const bank = Array.isArray(t.tenant_banking_details) ? t.tenant_banking_details[0] : t.tenant_banking_details;
                            return bank ? {
                                bankName: bank.bank_name,
                                accountNumber: bank.account_number,
                                accountHolderName: bank.account_holder_name,
                                ifsc: bank.ifsc,
                                booksStartDate: bank.books_start_date,
                                financialYearClosing: bank.financial_year_closing
                            } : undefined;
                        })(),

                        systemConfig: (() => {
                            const config = Array.isArray(t.tenant_system_config) ? t.tenant_system_config[0] : t.tenant_system_config;
                            return config ? {
                                isPosEnabled: config.is_pos_enabled,
                                isInventoryEnabled: config.is_inventory_enabled,
                                isLoyaltyEnabled: config.is_loyalty_enabled,
                                isMultiBranch: config.is_multibranch_enabled,
                                isEcommerceEnabled: config.is_ecommerce_enabled,
                                pricingMode: config.pricing_mode
                            } : undefined;
                        })(),

                        integrations: (() => {
                            const integrations = Array.isArray(t.tenant_integrations) ? t.tenant_integrations[0] : t.tenant_integrations;
                            return integrations ? {
                                paymentGatewayKey: integrations.payment_gateway_key,
                                smsProviderKey: integrations.sms_provider_key,
                                emailProviderKey: integrations.email_provider_key,
                                webhookUrl: integrations.webhook_url
                            } : undefined;
                        })(),

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

                    // --- Fetch Employees (from tenant_users) ---
                    let eQuery = supabase.from('tenant_users').select(`
                        *,
                        role:roles(code, description)
                    `);

                    if (isolatedTenantId) {
                        eQuery = eQuery.eq('tenant_id', isolatedTenantId);
                    }
                    const { data: empData, error: empErr } = await eQuery;
                    if (empErr) throw empErr;

                    if (empData) {
                        const mappedEmployees = empData.map((e: any) => {
                            let bId = e.assigned_branch_id; // V3 Schema uses assigned_branch_id

                            // Determine system role from role code
                            const roleCode = e.role?.code?.toLowerCase() || 'staff';
                            const derivedSystemRole = (roleCode === DbRoleCode.OWNER || roleCode === DbRoleCode.ADMIN) ? 'Owner' : 'Staff';

                            return {
                                id: e.id,
                                name: e.full_name, // Map full_name -> name
                                role: e.role?.description || roleCode, // Use description if available, else code
                                systemRole: derivedSystemRole,
                                pin: e.pin_hash || '', // Map pin_hash -> pin
                                dailyRate: 0, // Legacy field not in tenant_users
                                sector: 'General', // Default
                                branchId: bId,
                                tenantId: e.tenant_id,
                                mobile: e.mobile, // Map mobile
                                roleId: e.role_id
                            };
                        }) as Employee[];

                        dispatch(setEmployees(mappedEmployees));

                        // Auto-Repair current session user branchId if it's lagging with temporary ID
                        if (user && user.id) {
                            const currentUserInList = mappedEmployees.find(me => me.id === user.id);
                            if (currentUserInList && currentUserInList.branchId !== user.branchId) {
                                console.log(`[Repair] Updating session branchId for ${user.name}: ${user.branchId} -> ${currentUserInList.branchId}`);
                                const updatedUser: TenantUser = {
                                    id: currentUserInList.id,
                                    tenantId: currentUserInList.tenantId || user.tenantId,
                                    roleId: currentUserInList.roleId,
                                    fullName: currentUserInList.name,
                                    name: currentUserInList.name,
                                    mobile: currentUserInList.mobile,
                                    email: user.email,
                                    role: currentUserInList.role,
                                    systemRole: currentUserInList.systemRole,
                                    branchId: currentUserInList.branchId as unknown as string,
                                    sector: currentUserInList.sector,
                                    permissions: user.permissions
                                };
                                dispatch(setUser(updatedUser));
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

                // Textile Categories (Master Data)
                let catQuery = supabase.from('cloth_product_master').select('*');
                if (tId) catQuery = catQuery.eq('tenant_id', tId);
                const { data: catData, error: catError } = await catQuery;
                if (!catError && catData) {
                    const uniqueCategories = Array.from(new Set(catData.map((c: any) => c.product_name).filter(Boolean)));
                    dispatch(setCategories(uniqueCategories as string[]));
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

                // Daily Finance
                let dfQuery = supabase.from('daily_finance').select('*');
                if (tId) dfQuery = dfQuery.eq('tenant_id', tId);
                const { data: dfData, error: dfError } = await dfQuery;
                if (dfError) console.error('Error fetching daily finance:', dfError);
                if (dfData) {
                    const mappedDF = dfData.map((df: any) => ({
                        id: df.id,
                        date: df.date,
                        cashSales: df.cash_sales,
                        onlineSales: df.online_sales,
                        totalSales: df.total_sales,
                        expenses: df.expenses,
                        cashInDrawer: df.cash_in_drawer,
                        notes: df.notes,
                        timestamp: df.timestamp,
                        tenantId: df.tenant_id
                    }));
                    dispatch(setDailyRecords(mappedDF));
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

                // --- User Specific Visual Preferences ---
                if (tId && user?.id) {
                    const { data: userVisual, error: userVisualError } = await supabase
                        .from('tenant_user_visual_identity')
                        .select('*')
                        .eq('tenant_id', tId)
                        .eq('user_id', user.id)
                        .maybeSingle(); // maybeSingle handles "no rows" gracefully

                    if (userVisualError) console.error('Error fetching user visual preferences:', userVisualError);
                    if (userVisual) {
                        dispatch(setUserPreferences({
                            theme: userVisual.theme,
                            primaryColor: userVisual.primary_color,
                            loginLogoUrl: userVisual.login_logo_url,
                            visualIdentityConfig: userVisual.visual_identity_config
                        }));
                    }
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
        // 3. Real-time Subscription for Products (Central Stock Sync)
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

        // 4. Real-time Subscription for Tenant & Accessory Tables
        const tenantTables = [
            'tenants',
            'tenant_business_info',
            'tenant_company_details',
            'tenant_tax_details',
            'tenant_banking_details',
            'tenant_system_config',
            'tenant_integrations'
        ];

        const tenantChannels = tenantTables.map(tableName => {
            return supabase
                .channel(`public:${tableName}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: tableName,
                    filter: tableName !== 'tenants' && tenantId ? `tenant_id=eq.${tenantId}` : undefined
                }, () => {
                    // When any tenant-related table changes, refresh tenant data
                    fetchData();
                })
                .subscribe();
        });

        // 5. Real-time Subscription for User Visual Identity
        if (user?.id && tenantId) {
            const userVisualChannel = supabase
                .channel(`public:tenant_user_visual_identity:${user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'tenant_user_visual_identity',
                    filter: `user_id=eq.${user.id}`
                }, () => {
                    fetchData();
                })
                .subscribe();
            tenantChannels.push(userVisualChannel);
        }

        // 3. Periodic Background Sync for Daily Finance (30s)
        const syncInterval = setInterval(() => {
            if (navigator.onLine) {
                SyncManager.syncDailyFinanceEntries();
            }
        }, 30000);

        return () => {
            supabase.removeChannel(productChannel);
            tenantChannels.forEach(channel => supabase.removeChannel(channel));
            clearInterval(syncInterval);
        };
    }, [dispatch, user, branches, tenants]);

    return { loading, error };
};

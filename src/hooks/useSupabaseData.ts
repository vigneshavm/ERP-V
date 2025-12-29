import { APP_CONFIG } from '../config';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setTenants, setBranches } from '../store/tenantSlice';
import { setProducts } from '../store/inventorySlice';
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

export const useSupabaseData = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
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
                const { data, error } = await supabase
                    .from('tenants')
                    .select('*');

                if (error) throw error;

                if (data) {
                    // Transform if necessary, or ensure DB matches types
                    // Assuming DB columns match Tenant type or mapping is needed
                    // For now, direct dispatch if structure aligns, or partial map
                    const validTenants = data.map((t: any) => ({
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
                        locations: t.locations || []
                    })) as Tenant[];

                    dispatch(setTenants(validTenants));

                    // Fetch Branches (Global or for initial state)
                    const { data: branchData, error: bErr } = await supabase.from('branches').select('*');
                    if (bErr) throw bErr;
                    if (branchData) {
                        dispatch(setBranches(branchData.map((b: any) => {
                            const tenant = validTenants.find(t => t.id === b.tenant_id);
                            return {
                                id: b.id,
                                tenantId: b.tenant_id,
                                name: b.name,
                                city: b.city,
                                address: b.address,
                                sector: tenant?.sector || 'General'
                            };
                        })));
                    }

                    // Fetch Employees (Needed for Login)
                    const { data: empData, error: empError } = await supabase.from('employees').select('*');
                    if (empError) throw empError;
                    if (empData) {
                        dispatch(setEmployees(empData.map((e: any) => ({
                            id: e.id,
                            name: e.name,
                            role: e.role,
                            dailyRate: e.daily_rate,
                            sector: e.sector,
                            systemRole: e.system_role,
                            pin: e.pin,
                            branchId: e.branch_id,
                            tenantId: e.tenant_id
                        })) as Employee[]));
                    }
                }
            } catch (err: any) {
                console.error('Error fetching tenants:', err);
            }
        };

        fetchTenants();
    }, [dispatch]);

    // 2. Fetch Tenant Specific Data (Products, Customers, Sales) - On Login
    useEffect(() => {
        if (!APP_CONFIG.USE_SUPABASE) return;
        if (!user || !user.branchId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!supabase) return;

                // Products
                const { data: productsData, error: prodError } = await supabase.from('products').select('*');
                if (prodError) throw prodError;
                if (productsData) {
                    const mappedProducts = productsData.map((p: any) => ({
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
                    })) as Product[];
                    dispatch(setProducts(mappedProducts));
                }

                // Customers
                const { data: custData, error: custError } = await supabase.from('customers').select('*');
                if (custError) throw custError;
                if (custData) dispatch(setCustomersList(custData as Customer[]));

                // Labor Payments
                const { data: lpData, error: lpError } = await supabase.from('labor_payments').select('*');
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

                // Sales (Renamed from bills in schema)
                const { data: salesData, error: salesError } = await supabase.from('sales').select('*').limit(100);
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
                const { data: txData, error: txError } = await supabase.from('transactions').select('*');
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
                const { data: chequeData, error: chequeError } = await supabase.from('cheques').select('*');
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
                const { data: poData, error: poError } = await supabase.from('purchase_orders').select('*');
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
    }, [dispatch, user]);

    return { loading, error };
};

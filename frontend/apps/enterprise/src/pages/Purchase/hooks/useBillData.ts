
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from "@/shared/api/api";
import { PurchaseBill, PurchaseBillItem, PurchaseOrder, GRN, BillStatus } from "@repo/shared";

export const useBillData = (id?: string, grnId?: string, initialData?: PurchaseBill | null) => {
    const [bill, setBill] = useState<Partial<PurchaseBill>>({
        bill_date: new Date().toISOString().split('T')[0],
        vendorInvoiceNo: '',
        status: 'Received',
        amount: 0,
        total_amount: 0,
        tax_breakdown: { cgst: 0, sgst: 0, igst: 0, vat: 0, other: 0 },
        payment_terms: 'Net 30',
        due_date: '',
        attachments: [],
        items: []
    });

    const [vendors, setVendors] = useState<any[]>([]);
    const [pos, setPos] = useState<PurchaseOrder[]>([]);
    const [grns, setGrns] = useState<GRN[]>([]);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Vendors
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const { data } = await api.get('/suppliers');
                setVendors(data || []);
            } catch (err) {
                console.error("Failed to fetch suppliers", err);
            }
        };
        fetchVendors();
    }, []);

    // Fetch Bill if ID exists
    useEffect(() => {
        if (id) {
            const fetchBill = async () => {
                try {
                    const { data } = await api.get(`/api/bills/${id}`);
                    setBill(data);
                    setAttachments(data.attachments || []);
                } catch (err) {
                    console.error("Failed to fetch bill", err);
                    toast.error("Failed to load bill details");
                }
            };
            fetchBill();
        }
    }, [id]);

    // Handle Initial Data
    useEffect(() => {
        if (initialData) {
            setBill(initialData);
            setAttachments(initialData.attachments || []);
        }
    }, [initialData]);

    const handleVendorChange = useCallback((vendorId: string) => {
        const vendor = vendors.find(v => v.id === vendorId || v._id === vendorId);
        setBill(prev => ({
            ...prev,
            vendor_id: vendorId,
            vendor_name: vendor?.businessName || vendor?.name || '',
            po_id: undefined,
            grn_id: undefined,
            items: []
        }));
    }, [vendors]);

    // Fetch POs and GRNs when vendor is selected
    useEffect(() => {
        if (!bill.vendor_id) return;

        // Avoid re-fetching if we already have data for this vendor (opt.)
        // For now, simplicity: always fetch to get latest
        const fetchData = async () => {
            try {
                const [poRes, grnRes] = await Promise.all([
                    api.get(`/api/purchases?vendorId=${bill.vendor_id}`),
                    api.get(`/api/grns?vendorId=${bill.vendor_id}`)
                ]);
                setPos(poRes.data || []);
                const fetchedGrns = grnRes.data || [];
                setGrns(fetchedGrns);

                // Auto-select GRN if provided in URL and not yet set
                if (grnId && !bill.grn_id) {
                    const targetGrn = fetchedGrns.find((g: any) => g.id === grnId || g._id === grnId);
                    if (targetGrn) {
                        // We need to pass the freshly fetched data to handleGRNChange
                        // But handleGRNChange is designed to look at state. 
                        // Let's refactor handleGRNChange to accept data or use what's available.
                        // Ideally, we just force the state update here directly or call a version of handleGRNChange.

                        // Let's just manually trigger map here to avoid complexity with stale state in closure
                        mapGrnToBill(targetGrn, poRes.data || []);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch POs/GRNs", err);
            }
        };
        fetchData();
    }, [bill.vendor_id, grnId]);


    const mapGrnToBill = useCallback((grn: any, availablePos: PurchaseOrder[]) => {
        // Map GRN items to Bill items
        const billItems: PurchaseBillItem[] = grn.items.map((item: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            product_id: item.productId,
            product_name: item.productName,
            sku: item.sku,
            grn_quantity: item.acceptedQty,
            bill_quantity: item.acceptedQty,
            grn_rate: 0,
            bill_rate: 0,
            tax_percent: 0,
            discount_amount: 0,
            line_total: 0,
            variance_flag: false
        }));

        // Sync with PO if available
        const linkedPO = availablePos.find(p => p.id === grn.poId || p.po_number === grn.poNumber);
        if (linkedPO) {
            billItems.forEach(bi => {
                const poItem = linkedPO.items.find(pi => pi.product_id === bi.product_id || pi.sku === bi.sku);
                if (poItem) {
                    bi.grn_rate = poItem.rate;
                    bi.bill_rate = poItem.rate;
                    bi.tax_percent = poItem.tax_percent;
                    bi.line_total = bi.bill_quantity * bi.bill_rate;
                }
            });
        }

        setBill(prev => ({
            ...prev,
            grn_id: grn.id || grn._id,
            grn_number: grn.grnNumber,
            po_id: grn.poId,
            po_number: grn.poNumber,
            items: billItems
        }));
    }, []);


    const handleGRNChange = useCallback((selectedGrnId: string) => {
        const grn = grns.find(g => g.id === selectedGrnId || (g as any)._id === selectedGrnId);
        if (grn) {
            mapGrnToBill(grn, pos);
        }
    }, [grns, pos, mapGrnToBill]);


    const updateItem = useCallback((index: number, field: keyof PurchaseBillItem, value: any) => {
        setBill(prev => {
            const newItems = [...(prev.items || [])] as PurchaseBillItem[];
            if (!newItems[index]) return prev;

            const item = { ...newItems[index], [field]: value };

            // Calculate totals and variance
            if (field === 'bill_quantity' || field === 'bill_rate') {
                item.line_total = item.bill_quantity * item.bill_rate;
                item.variance_flag = item.bill_rate !== item.grn_rate || item.bill_quantity !== item.grn_quantity;
            }

            newItems[index] = item;
            return { ...prev, items: newItems };
        });
    }, []);

    const updateBillField = useCallback((field: keyof PurchaseBill, value: any) => {
        setBill(prev => ({ ...prev, [field]: value }));
    }, []);

    const addAttachment = useCallback((fileName: string) => {
        setAttachments(prev => [...prev, fileName]);
    }, []);

    const removeAttachment = useCallback((index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    }, []);

    return {
        bill,
        setBill,
        vendors,
        pos,
        grns,
        attachments,
        setAttachments,
        isLoading,
        setIsLoading,
        handleVendorChange,
        handleGRNChange,
        updateItem,
        updateBillField,
        addAttachment,
        removeAttachment
    };
};


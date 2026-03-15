import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import { addGRN } from "@/entities/purchase/model/purchaseSlice";
import { GRN, GRNItem, GRNStatus, PurchaseOrder } from "@repo/shared";

export const useGRNForm = () => {
    const { poId } = useParams<{ poId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { orders } = useSelector((state: RootState) => state.purchase);
    const {  user, currentBranch  } = useAuthStore();

    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [grnData, setGrnData] = useState<Partial<GRN>>({
        // eslint-disable-next-line react-hooks/purity -- TODO(TS-FIX): Phase 2/3 fix
        grnNumber: `GRN-${Math.floor(100000 + Math.random() * 900000)}`,
        receivedDate: new Date().toISOString().split('T')[0],
        status: 'Draft',
        items: [],
        notes: '',
        attachments: []
    });

    const availablePOs = useMemo(() => {
        return orders.filter((o: PurchaseOrder) => o.status === 'Approved' || o.status === 'Partial Receipt');
    }, [orders]);

    const initializeGRNFromPO = (order: PurchaseOrder) => {
        const items: GRNItem[] = order.items.map((item: any) => ({
            id: `ITEM-${Math.random().toString(36).substr(2, 9)}`,
            poItemId: item.product_id || '',
            productId: item.product_id || '',
            productName: item.product_name,
            sku: item.sku,
            orderedQty: item.quantity,
            receivedQty: item.quantity - (item.received_quantity || 0),
            acceptedQty: item.quantity - (item.received_quantity || 0),
            rejectedQty: 0,
            inspectionStatus: 'Accepted',
            discrepancyNotes: ''
        }));

        setGrnData((prev: Partial<GRN>) => ({
            ...prev,
            poId: order.id,
            poNumber: order.po_number,
            vendorId: order.vendor_id || '',
            vendorName: order.vendor_name,
            items: items
        }));
    };

    // Fetch PO details if poId is provided
    useEffect(() => {
        if (poId) {
            const order = orders.find((o: PurchaseOrder) => o.id === poId);
            if (order) {
                setSelectedPO(order);
                initializeGRNFromPO(order);
            }
        }
    }, [poId, orders]);

    const handlePOSelect = (poId: string) => {
        const order = orders.find((o: PurchaseOrder) => o.id === poId);
        if (order) {
            setSelectedPO(order);
            initializeGRNFromPO(order);
        }
    };

    const handleItemChange = (index: number, field: keyof GRNItem, value: any) => {
        const newItems = [...(grnData.items || [])];
        const item = { ...newItems[index], [field]: value };

        // Auto-calculate accepted/rejected if receivedQty changes
        if (field === 'receivedQty') {
            item.acceptedQty = value;
            item.rejectedQty = 0;
            item.inspectionStatus = 'Accepted';
        }

        // Auto-calculate rejected if accepted changes
        if (field === 'acceptedQty') {
            item.rejectedQty = Math.max(0, item.receivedQty - value);
            item.inspectionStatus = item.rejectedQty > 0 ? 'Partial' : 'Accepted';
        }

        newItems[index] = item;
        setGrnData((prev: Partial<GRN>) => ({ ...prev, items: newItems }));
    };

    const saveGRN = (status: GRNStatus) => {
        const finalGRN: GRN = {
            ...grnData as GRN,
            status,
            created_at: new Date().toISOString(),
            created_by: user?.name,
            branch_id: currentBranch || 'Main'
        };

        dispatch(addGRN(finalGRN));
        navigate('/purchase/grn');
    };

    const setGrnField = (field: keyof GRN, value: any) => {
        setGrnData(prev => ({ ...prev, [field]: value }));
    };

    return {
        poId,
        grnData,
        selectedPO,
        availablePOs,
        handlePOSelect,
        handleItemChange,
        saveGRN,
        setGrnField,
        navigate
    };
};


import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from "../../../redux/store";
import { addGRN } from "../../../redux/slices/purchaseSlice";
import { GRN, GRNItem, GRNStatus, PurchaseOrder } from "../../../types/purchase";
import { normalizePurchaseOrderItem } from "../../../utils/purchaseNormalize";
import { createGRN, mapGrnToFrontendGRN } from "../../../services/grnService";
import { fetchMasterEntries } from "../../../redux/slices/masterDataSlice";

export const useGRNForm = () => {
    const { poId } = useParams<{ poId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { orders } = useSelector((state: RootState) => state.purchase);
    const { user, currentBranch } = useSelector((state: RootState) => state.auth);

    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [grnData, setGrnData] = useState<Partial<GRN>>({
        grnNumber: `GRN-${Math.floor(100000 + Math.random() * 900000)}`,
        receivedDate: new Date().toISOString().split('T')[0],
        status: 'INSPECTED',
        items: [],
        notes: '',
        attachments: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Warehouse picker for "which location did this shipment arrive at" -- previously the GRN
    // form never sent warehouseId at all, so every receipt silently defaulted to 'MAIN_WAREHOUSE'
    // server-side regardless of which warehouse actually received it.
    useEffect(() => {
        dispatch(fetchMasterEntries({ type: 'WAREHOUSE' }) as any);
    }, [dispatch]);
    const { entriesByType } = useSelector((state: RootState) => state.masterData);
    const warehouses = entriesByType.WAREHOUSE || [];

    // A PO can only be received against once it's actually been sent to the vendor (or is
    // already partially received) - matches PurchaseOrderDetails' canReceive check, so both
    // receiving entry points (from a PO's own detail page, or from this standalone GRN form)
    // agree on when receiving is allowed.
    const availablePOs = useMemo(() => {
        return orders.filter((o: PurchaseOrder) => o.status === 'SENT_TO_VENDOR' || o.status === 'PARTIALLY_RECEIVED');
    }, [orders]);

    const initializeGRNFromPO = (order: PurchaseOrder) => {
        const items: GRNItem[] = order.items.map((rawItem: any) => {
            // Defensive: normalize in case `order` came from somewhere that skipped
            // normalizePurchaseOrder (e.g. stale localStorage-persisted Redux state).
            const item = normalizePurchaseOrderItem(rawItem);
            const outstanding = Math.max(0, (item.quantity || 0) - (item.received_quantity || 0));
            return {
                id: `ITEM-${Math.random().toString(36).substr(2, 9)}`,
                poItemId: item.product_id || '',
                productId: item.product_id || '',
                productName: item.product_name,
                sku: item.sku,
                orderedQty: item.quantity,
                receivedQty: outstanding,
                acceptedQty: outstanding,
                rejectedQty: 0,
                inspectionStatus: 'Accepted',
                discrepancyNotes: ''
            };
        });

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

    // Actually calls the backend (POST /api/grn via GRNController.createGRN), which moves
    // inventory and updates the parent PO's status - this used to only dispatch to local Redux
    // and never touched the backend at all.
    const saveGRN = async (___status?: GRNStatus) => {
        if (!grnData.poId || !grnData.items || grnData.items.length === 0) {
            setSaveError('Select a Purchase Order with items before saving a receipt.');
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        try {
            const result = await createGRN({
                purchaseId: grnData.poId as string,
                notes: grnData.notes,
                warehouseId: grnData.warehouseId,
                items: grnData.items
                    .filter(i => i.receivedQty > 0)
                    .map(i => ({
                        productId: i.productId,
                        productName: i.productName,
                        receivedQty: i.receivedQty,
                        rejectedQty: i.rejectedQty,
                        lotNumber: i.batchNumber,
                        rejectionReason: i.discrepancyNotes,
                    })),
            });

            if (result?.grn) {
                dispatch(addGRN(mapGrnToFrontendGRN(result.grn, {
                    poNumber: grnData.poNumber,
                    vendorName: grnData.vendorName,
                    branchId: currentBranch || 'Main',
                    createdBy: user?.name,
                })));
            }
            navigate('/purchase/grn');
        } catch (err: any) {
            setSaveError(err?.response?.data?.message || err?.message || 'Failed to save goods receipt');
        } finally {
            setIsSaving(false);
        }
    };

    const setGrnField = (field: keyof GRN, value: any) => {
        setGrnData(prev => ({ ...prev, [field]: value }));
    };

    return {
        poId,
        grnData,
        selectedPO,
        availablePOs,
        warehouses,
        handlePOSelect,
        handleItemChange,
        saveGRN,
        isSaving,
        saveError,
        setGrnField,
        navigate
    };
};

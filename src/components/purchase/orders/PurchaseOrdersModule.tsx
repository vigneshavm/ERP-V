
import React, { useState, useEffect } from 'react';
import { usePurchaseOrders, PurchaseOrder, PurchaseOrderItem } from '../../../hooks/usePurchaseOrders';
import PurchaseOrderList from './PurchaseOrderList';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderDetails from './PurchaseOrderDetails';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setActiveTab } from '../../../store'; // Adjust import based on your store setup

const PurchaseOrdersModule: React.FC = () => {
    const { orders, fetchOrders, fetchOrderDetails, saveOrder, updateStatus, loading } = usePurchaseOrders();
    const [view, setView] = useState<'LIST' | 'FORM' | 'DETAILS'>('LIST');
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [selectedItems, setSelectedItems] = useState<PurchaseOrderItem[]>([]);

    // Using dispatch to switch tab for conversion
    const dispatch = useDispatch();

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleCreate = () => {
        setSelectedOrder(null);
        setSelectedItems([]);
        setView('FORM');
    };

    const handleView = async (id: string) => {
        const fullDetails = await fetchOrderDetails(id);
        if (fullDetails) {
            setSelectedOrder(fullDetails);
            setSelectedItems(fullDetails.items || []);
            setView('DETAILS');
        }
    };

    const handleSave = async (order: Partial<PurchaseOrder>, items: PurchaseOrderItem[]) => {
        await saveOrder(order, items);
        setView('LIST');
    };

    const handleApprove = async () => {
        if (selectedOrder) {
            if (confirm('Are you sure you want to approve this order?')) {
                await updateStatus(selectedOrder.id, 'Approved');
                // Refresh local state
                const updated = { ...selectedOrder, status: 'Approved' } as PurchaseOrder;
                setSelectedOrder(updated);
            }
        }
    };

    const handleConvert = (order: PurchaseOrder, items: PurchaseOrderItem[]) => {
        if (confirm('This will navigate to Purchase Entry to finalize the purchase. Continue?')) {
            // We need to pass data to Purchase Entry. 
            // Since PurchaseEntry stores state locally or via URL params usually, 
            // for now we will rely on a custom event or Redux if available.
            // A simple way is to use localStorage to pass "draft_purchase" data 
            // and have PurchaseEntry check for it on mount.

            const conversionData = {
                po_id: order.id,
                vendor_id: order.supplier_id,
                items: items.map(i => ({
                    productId: i.product_id,
                    quantity: i.quantity,
                    rate: i.rate,
                    tax: i.tax_percent,
                    discount: i.discount_amount
                }))
            };

            localStorage.setItem('pending_po_conversion', JSON.stringify(conversionData));

            // Navigate
            dispatch(setActiveTab('PURCHASE_ENTRY'));
        }
    };

    if (loading && orders.length === 0) return <div className="p-6">Loading Orders...</div>;

    return (
        <div className="h-full flex flex-col p-6 animate-in fade-in space-y-6">
            {view === 'LIST' && (
                <>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4">Purchase Orders</h1>
                    <PurchaseOrderList orders={orders} onCreate={handleCreate} onView={handleView} />
                </>
            )}

            {view === 'FORM' && (
                <PurchaseOrderForm
                    onBack={() => setView('LIST')}
                    onSave={handleSave}
                    initialData={selectedOrder}
                />
            )}

            {view === 'DETAILS' && selectedOrder && (
                <PurchaseOrderDetails
                    order={selectedOrder}
                    items={selectedItems}
                    onBack={() => setView('LIST')}
                    onApprove={handleApprove}
                    onConvert={handleConvert}
                />
            )}
        </div>
    );
};

export default PurchaseOrdersModule;

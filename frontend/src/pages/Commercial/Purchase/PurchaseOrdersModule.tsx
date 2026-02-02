import React, { useState, useEffect } from 'react';
import { usePurchaseOrders } from "../../../hooks/usePurchaseOrders";
import { PurchaseOrder, PurchaseOrderItem } from "../../../types/purchase";
import PurchaseOrderList from './PurchaseOrderList';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderDetails from './PurchaseOrderDetails';
import { useDispatch } from 'react-redux';
import { setActiveTab } from "../../../redux/slices/uiSlice";
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import StatsCard from "../../../components/shared/Display/StatsCard";
import { ClipboardList, Clock, CheckCircle, Lock, Plus } from 'lucide-react';

const PurchaseOrdersModule: React.FC = () => {
    const { orders, fetchOrders, fetchOrderDetails, saveOrder, updateStatus, loading, stats } = usePurchaseOrders();
    const [view, setView] = useState<'LIST' | 'FORM' | 'DETAILS'>('LIST');
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [selectedItems, setSelectedItems] = useState<PurchaseOrderItem[]>([]);

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
                const updated = { ...selectedOrder, status: 'Approved' } as PurchaseOrder;
                setSelectedOrder(updated);
            }
        }
    };

    const handleConvert = (order: PurchaseOrder, items: PurchaseOrderItem[]) => {
        if (confirm('This will navigate to Purchase Entry to finalize the purchase. Continue?')) {
            const conversionData = {
                po_id: order.id,
                vendor_id: order.vendor_id,
                items: items.map(i => ({
                    productId: i.product_id,
                    quantity: i.quantity,
                    rate: i.rate,
                    tax: i.tax_percent,
                    discount: i.discount_amount
                }))
            };
            localStorage.setItem('pending_po_conversion', JSON.stringify(conversionData));
            dispatch(setActiveTab('PURCHASE_ENTRY'));
        }
    };

    const renderContent = () => {
        if (loading && orders.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mb-4"></div>
                    <p className="text-neutral-500 font-medium">Loading orders...</p>
                </div>
            );
        }

        switch (view) {
            case 'LIST':
                return (
                    <div className="space-y-6">
                        <PageHeader
                            title="Purchase Orders"
                            description="Create and track procurement orders with suppliers"
                            actions={
                                <button
                                    onClick={handleCreate}
                                    className="btn btn-primary"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Order
                                </button>
                            }
                        />

                        {/* Stats Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatsCard
                                title="Total Orders"
                                value={stats.total}
                                icon={<ClipboardList className="w-full h-full" />}
                                iconBgColor="bg-blue-100"
                                iconColor="text-blue-600"
                            />
                            <StatsCard
                                title="Pending Approval"
                                value={stats.pending}
                                icon={<Clock className="w-full h-full" />}
                                iconBgColor="bg-amber-100"
                                iconColor="text-amber-600"
                                trend="Awaiting review"
                                trendUp={false}
                            />
                            <StatsCard
                                title="Approved"
                                value={stats.approved}
                                icon={<CheckCircle className="w-full h-full" />}
                                iconBgColor="bg-emerald-100"
                                iconColor="text-emerald-600"
                                trend="Ready for conversion"
                                trendUp={true}
                            />
                            <StatsCard
                                title="Converted"
                                value={stats.converted}
                                icon={<Lock className="w-full h-full" />}
                                iconBgColor="bg-neutral-100"
                                iconColor="text-neutral-600"
                                trend="Fulfilled"
                                trendUp={true}
                            />
                        </div>

                        <PurchaseOrderList orders={orders} onCreate={handleCreate} onView={handleView} />
                    </div>
                );
            case 'FORM':
                return (
                    <PurchaseOrderForm
                        onBack={() => setView('LIST')}
                        onSave={handleSave}
                        initialData={selectedOrder}
                    />
                );
            case 'DETAILS':
                return selectedOrder && (
                    <PurchaseOrderDetails
                        order={selectedOrder}
                        items={selectedItems}
                        onBack={() => setView('LIST')}
                        onApprove={handleApprove}
                        onConvert={handleConvert}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Layout>
            <div className="h-full animate-fade-in pb-10">
                {renderContent()}
            </div>
        </Layout>
    );
};

export default PurchaseOrdersModule;


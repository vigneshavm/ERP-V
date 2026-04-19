import React, { useState, useEffect } from 'react';
import { usePurchaseOrders } from "../../hooks/usePurchaseOrders";
import { PurchaseOrder, PurchaseOrderItem } from "../../types/purchase";
import PurchaseOrderList from './PurchaseOrderList';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderDetails from './PurchaseOrderDetails';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab } from "../../redux/slices/uiSlice";
import { RootState } from "../../redux/store";
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { ClipboardList, Clock, CheckCircle, Lock, Plus, Activity, Zap } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const PurchaseOrdersModule: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { orders, fetchOrders, fetchOrderDetails, saveOrder, updateStatus, loading, stats } = usePurchaseOrders();
    const [view, setView] = useState<'LIST' | 'FORM' | 'DETAILS'>('LIST');
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [selectedItems, setSelectedItems] = useState<PurchaseOrderItem[]>([]);

    const dispatch = useDispatch();
    const activeTab = useSelector((state: RootState) => state.ui.activeTab);

    useEffect(() => {
        if (id) {
            if (id === 'new') {
                setView('FORM');
                setSelectedOrder(null);
                setSelectedItems([]);
            } else {
                handleView(id);
            }
            return;
        }

        if (activeTab === 'PURCHASE_ORDER_FORM') {
            setView('FORM');
            setSelectedOrder(null);
            setSelectedItems([]);
        } else if (activeTab === 'PURCHASE_ORDER_LIST' || activeTab === 'PURCHASE_ORDER') {
            setView('LIST');
        }
    }, [activeTab, id]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleCreate = () => {
        navigate('/purchase/orders/new');
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
        navigate('/purchase/orders');
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
                vendor_id: typeof order.vendor_id === 'object' ? (order.vendor_id as any)._id || (order.vendor_id as any).id : order.vendor_id,
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
                <div className="flex justify-center items-center py-40">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing Purchase Nodes...</p>
                    </div>
                </div>
            );
        }

        switch (view) {
            case 'LIST':
                return (
                    <div className="space-y-10">
                        <PageHeader
                            title="Purchase Orders"
                            description="Institutional procurement management and supply chain coordination."
                            breadcrumbs={[
                                { label: 'Home', link: '/dashboard' },
                                { label: 'Procurement', link: '/purchase' },
                                { label: 'Orders' }
                            ]}
                            actions={
                                <button
                                    onClick={handleCreate}
                                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-widest"
                                >
                                    <Plus className="w-4 h-4" /> New Order
                                </button>
                            }
                        />

                        {/* Stats Node Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group hover:border-blue-500/20 transition-all duration-500">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-500 dark:bg-blue-900/20 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                                        <ClipboardList className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Total Orders</h3>
                                </div>
                                <p className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums">{stats.total}</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group hover:border-amber-500/20 transition-all duration-500">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-amber-50 text-amber-500 dark:bg-amber-900/20 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Awaiting Review</h3>
                                </div>
                                <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tighter tabular-nums">{stats.pending}</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group hover:border-emerald-500/20 transition-all duration-500">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Approved Nodes</h3>
                                </div>
                                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter tabular-nums">{stats.approved}</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm group hover:border-neutral-400/20 transition-all duration-500">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Fulfilled</h3>
                                </div>
                                <p className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums">{stats.converted}</p>
                            </div>
                        </div>

                        <PurchaseOrderList orders={orders} onCreate={handleCreate} onView={handleView} />
                    </div>
                );
            case 'FORM':
                return (
                    <PurchaseOrderForm
                        onBack={() => navigate('/purchase/orders')}
                        onSave={handleSave}
                        initialData={selectedOrder}
                    />
                );
            case 'DETAILS':
                return selectedOrder && (
                    <PurchaseOrderDetails
                        order={selectedOrder}
                        items={selectedItems}
                        onBack={() => navigate('/purchase/orders')}
                        onApprove={() => updateStatus(selectedOrder.id, 'Approved')}
                        onConvert={handleConvert}
                        onUpdateStatus={updateStatus}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Layout>
            <div className="pb-32">
                {renderContent()}
            </div>
        </Layout>
    );
};

export default PurchaseOrdersModule;

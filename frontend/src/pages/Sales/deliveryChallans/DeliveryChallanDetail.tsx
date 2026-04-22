import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Layout from "../../../components/shared/Layout/Layout";
import { getDeliveryChallanById, convertToInvoice, reset } from "../../../redux/slices/deliveryChallanSlice";
import { ArrowLeft, Printer, Truck, ArrowRightCircle, Phone, Mail } from 'lucide-react';
import { RootState } from "../../../redux/store";

const DeliveryChallanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { challan, isLoading, isError, message } = useSelector((state: RootState) => state.deliveryChallan);
    const [convertConfirm, setConvertConfirm] = useState(false);

    useEffect(() => {
        if (id) {
            dispatch(getDeliveryChallanById(id) as any);
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }
        return () => {
            dispatch(reset());
        };
    }, [isError, message, dispatch]);

    const handlePrint = () => {
        window.print();
    };

    const handleConvert = async () => {
        if (!id) return;
        const result = await dispatch(convertToInvoice(id) as any);
        setConvertConfirm(false);

        if (result.type.includes('fulfilled')) {
            toast.success('Converted to Invoice successfully!');
            const payload = result.payload as any;
            if (payload?.invoice?._id) {
                navigate(`/sales/invoice/${payload.invoice._id}`);
            }
        }
    };

    if (isLoading || !challan) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                    <p className="text-secondary font-medium">Loading challan...</p>
                </div>
            </Layout>
        );
    }

    const totalQuantity = (challan?.items || []).reduce((sum: number, item: any) => sum + (item.deliveredQty || 0), 0);

    return (
        <Layout>
            <div className="max-w-5xl mx-auto animate-fade-in pb-10">
                {/* Header - Hidden on print */}
                <div className="mb-8 print:hidden">
                    <button
                        onClick={() => navigate('/sales/delivery-challan-list')}
                        className="flex items-center text-secondary hover:text-primary mb-4 transition-colors font-medium gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Challan List
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-main tracking-tight flex items-center gap-2">
                                <Truck className="w-6 h-6 text-primary" />
                                Delivery Challan
                            </h1>
                            <p className="text-sm text-secondary mt-1">View and print delivery challan</p>
                        </div>
                        <div className="flex gap-2">
                            {challan.status !== 'Converted' && (
                                <button
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
                                    onClick={() => setConvertConfirm(true)}
                                >
                                    <ArrowRightCircle className="w-4 h-4" />
                                    Convert to Invoice
                                </button>
                            )}
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm font-medium"
                                onClick={handlePrint}
                            >
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>

                {/* Challan Container */}
                <div className="bg-card border border-default rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border-0 print:rounded-none">
                    {/* Header Section */}
                    <div className="px-8 py-6 border-b-2 border-default print:border-gray-300">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold text-primary mb-1 tracking-tight">DELIVERY CHALLAN</h2>
                                <div className="text-base font-mono font-bold text-main">
                                    Challan #: {challan.challanNumber}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-xs font-bold text-secondary uppercase mb-1 tracking-wider">Challan Date</div>
                                <div className="font-bold text-base text-main">
                                    {new Date(challan.challanDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </div>
                                {challan.deliveryDate && (
                                    <>
                                        <div className="text-xs font-bold text-secondary uppercase mb-1 mt-2 tracking-wider">Delivery Date</div>
                                        <div className="font-bold text-base text-main">
                                            {new Date(challan.deliveryDate).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Customer and Status Section */}
                    <div className="grid grid-cols-2 gap-6 px-8 py-6">
                        <div>
                            <h3 className="text-xs font-bold text-secondary uppercase mb-3 pb-2 border-b border-default tracking-wider">
                                Delivered To
                            </h3>
                            <div className="space-y-2">
                                <div className="font-bold text-lg text-main">{challan.customer.name}</div>
                                <div className="text-sm text-secondary flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted" />
                                    {challan.customer.phone}
                                </div>
                                {challan.customer.email && (
                                    <div className="text-sm text-secondary flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted" />
                                        {challan.customer.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-right">
                            <h3 className="text-xs font-bold text-secondary uppercase mb-3 pb-2 border-b border-default tracking-wider">
                                Status
                            </h3>
                            <div className="space-y-2">
                                <div>
                                    <span className={`px-4 py-2 inline-flex text-sm font-bold rounded-full ${challan.status === 'Converted' ? 'bg-success/10 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                        challan.status === 'Delivered' ? 'bg-primary-soft text-primary' :
                                            'bg-surface text-secondary'
                                        }`}>
                                        {challan.status}
                                    </span>
                                </div>
                                {challan.convertedToInvoice && (
                                    <div className="text-sm text-secondary mt-2">
                                        Converted to Invoice: {challan.convertedToInvoice.invoiceNo}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="px-8 py-6 border-t border-default">
                        <h3 className="text-xs font-bold text-secondary uppercase mb-4">Items Delivered</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-default">
                                        <th className="text-left py-2 px-2 font-bold text-main">#</th>
                                        <th className="text-left py-2 px-2 font-bold text-main">Item Name</th>
                                        <th className="text-center py-2 px-2 font-bold text-main">Quantity</th>
                                        <th className="text-center py-2 px-2 font-bold text-main">Unit</th>
                                        <th className="text-left py-2 px-2 font-bold text-main">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(challan?.items || []).map((item: any, index: number) => (
                                        <tr key={index} className="border-b border-default">
                                            <td className="py-2 px-2 text-main">{index + 1}</td>
                                            <td className="py-2 px-2 text-main font-medium">
                                                {item.item?.name || 'N/A'}
                                                {item.item?.sku && <div className="text-xs text-secondary">{item.item.sku}</div>}
                                            </td>
                                            <td className="py-2 px-2 text-center text-main font-semibold">{item.deliveredQty}</td>
                                            <td className="py-2 px-2 text-center text-main">{item.unit}</td>
                                            <td className="py-2 px-2 text-main">{item.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Transport Details */}
                    {(challan.vehicleNo || challan.driverName || challan.transportMode) && (
                        <div className="px-8 py-6 border-t border-default">
                            <h3 className="text-xs font-bold text-secondary uppercase mb-4">Transport Details</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                {challan.transportMode && (
                                    <div>
                                        <div className="text-secondary mb-1">Transport Mode</div>
                                        <div className="font-medium text-main capitalize">{challan.transportMode}</div>
                                    </div>
                                )}
                                {challan.vehicleNo && (
                                    <div>
                                        <div className="text-secondary mb-1">Vehicle Number</div>
                                        <div className="font-medium text-main">{challan.vehicleNo}</div>
                                    </div>
                                )}
                                {challan.driverName && (
                                    <div>
                                        <div className="text-secondary mb-1">Driver Name</div>
                                        <div className="font-medium text-main">{challan.driverName}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="px-8 py-6 border-t border-default bg-surface">
                        <div className="flex justify-center">
                            <div className="w-full md:w-96">
                                <div className="space-y-4 bg-card p-6 rounded-lg shadow-sm border border-default">
                                    <div className="flex justify-between py-2 text-base">
                                        <span className="text-main">Total Items:</span>
                                        <span className="font-bold text-main">{(challan?.items || []).length}</span>
                                    </div>
                                    <div className="flex justify-between py-2 text-base border-t border-default">
                                        <span className="text-main">Total Quantity:</span>
                                        <span className="font-bold text-main">{totalQuantity}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {challan.notes && (
                        <div className="px-8 py-6 border-t border-default">
                            <h3 className="text-xs font-bold text-secondary uppercase mb-3 pb-2 border-b border-default">
                                Notes
                            </h3>
                            <p className="text-sm text-secondary leading-relaxed">{challan.notes}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-8 py-6 border-t border-default text-center">
                        <p className="text-sm text-main font-medium">Thank you for your business!</p>
                        <p className="text-xs text-secondary mt-2">This is a computer-generated delivery challan.</p>
                        {challan.createdAt && (
                            <p className="text-xs text-secondary mt-2">
                                Created on {new Date(challan.createdAt).toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Convert Confirmation Modal */}
            {convertConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-default">
                        <h3 className="text-lg font-bold text-main mb-4">Convert to Invoice</h3>
                        <p className="text-secondary mb-6">
                            Are you sure you want to convert this challan to an invoice? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConvertConfirm(false)}
                                className="flex-1 px-4 py-2 border border-default rounded-lg hover:bg-surface font-medium text-main"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConvert}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                            >
                                Convert
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    nav, aside, .print\\:hidden, button:not(.print\\:block) {
                        display: none !important;
                    }
                    
                    .max-w-5xl {
                        max-width: 100% !important;
                    }
                }
            `}</style>
        </Layout>
    );
};

export default DeliveryChallanDetail;

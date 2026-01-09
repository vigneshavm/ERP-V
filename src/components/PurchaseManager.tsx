import { useState, ChangeEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { parseInvoiceWithGemini } from '../services/geminiService';
import { useConfig } from './ConfigContext';
import { useBranchResolver } from '../hooks/useBranchResolver';
import {
    fetchVendors,
    processPurchaseApproval,
    RootState,
    AppDispatch,
    addOrder,
    addStockBulk,
    addTransaction,
    recordVendorTransaction
} from '../store';

import { ScannedInvoice, PurchaseOrder, FinalizedPurchaseItem } from '../types/purchase';
import { BranchId, TransactionType } from '../types/common';
import InvoiceResult from './InvoiceResult';

// Sub-components
import PurchaseOrderDetails from './purchase/PurchaseOrderDetails';
import PurchaseUpload from './purchase/PurchaseUpload';
import PurchaseHistory from './purchase/PurchaseHistory';

const PurchaseManager = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { currentSector, currentBranch, role } = useSelector((state: RootState) => state.auth);
    const { orders } = useSelector((state: RootState) => state.purchase);
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { tenantId } = useConfig();
    const { getBranchName } = useBranchResolver();
    const { vendors } = useSelector((state: RootState) => state.vendor);

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scannedData, setScannedData] = useState<ScannedInvoice | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [targetBranch, setTargetBranch] = useState<BranchId>('Alpha');
    const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);

    const sectorOrders = orders.filter(o => o.sector === currentSector);

    useEffect(() => {
        dispatch(fetchVendors());
    }, [dispatch]);

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);
        setIsProcessing(true);
        setError(null);
        setScannedData(null);

        try {
            const data = await parseInvoiceWithGemini(file);
            setScannedData(data);
            if (currentBranch !== 'All') setTargetBranch(currentBranch);
        } catch (err: any) {
            setError("Failed to process invoice. Ensure the image is clear.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCommitInventory = (items: FinalizedPurchaseItem[], vendorId: string | null) => {
        const isOwner = role === 'Owner';
        const orderTotal = items.reduce((sum, item) => sum + (item.cost * item.qty), 0);

        const newOrder = {
            id: Math.random().toString(36).substr(2, 9),
            vendor: vendors.find(v => v.id === vendorId)?.name || scannedData?.vendor || "Unknown Vendor",
            vendorId: vendorId || undefined,
            date: scannedData?.date || new Date().toISOString(),
            items: items.map(i => ({ name: i.name, qty: i.qty, cost: i.cost, sku: i.sku, productType: i.productType })),
            total: orderTotal,
            status: isOwner ? 'APPROVED' as const : 'PENDING' as const,
            sector: currentSector,
            branchId: targetBranch
        };

        dispatch(addOrder(newOrder));

        if (isOwner) {
            dispatch(addStockBulk(items.map(item => ({
                sku: item.sku,
                qty: item.qty,
                cost: item.cost,
                price: item.sellingPrice,
                name: item.name,
                category: item.category,
                productType: item.productType || 'General',
                sector: currentSector,
                branch: targetBranch,
                barcode: item.barcode
            }))));

            dispatch(addTransaction({
                id: Math.random().toString(36).substr(2, 9),
                type: TransactionType.EXPENSE,
                category: 'Inventory Restock',
                amount: orderTotal,
                date: new Date().toISOString(),
                description: `Invoice Payment - ${newOrder.vendor} (${targetBranch})`,
                sector: currentSector,
                branchId: targetBranch
            }));

            if (vendorId) {
                dispatch(recordVendorTransaction(
                    vendorId,
                    'PURCHASE',
                    orderTotal,
                    `Purchase Bill #${newOrder.id}`,
                    newOrder.id
                ));
            }
        } else {
            alert("Purchase Order created with PENDING status. An Owner must approve it to update inventory.");
        }

        setScannedData(null);
        setUploadedFile(null);
    };

    const handlePrintOrder = () => {
        const content = document.getElementById('po-modal-content-wrapper');
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=800,height=800');
        if (!printWindow) {
            alert("Please allow popups to print the order.");
            return;
        }

        let htmlContent = content.innerHTML;
        htmlContent = htmlContent.replace(/hidden print:block/g, 'block mb-6');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Purchase Order #${viewOrder?.id}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body { background: white; color: black; font-family: sans-serif; }
                        .no-print { display: none !important; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f1f5f9; text-align: left; padding: 10px; border: 1px solid #cbd5e1; }
                        td { padding: 10px; border: 1px solid #cbd5e1; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                    </style>
                </head>
                <body class="p-10">
                    ${htmlContent}
                    <script>
                        setTimeout(() => {
                            window.print();
                        }, 800);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (scannedData) {
        return (
            <div className="h-[calc(100vh-8rem)]">
                <InvoiceResult
                    initialData={scannedData}
                    file={uploadedFile}
                    sector={currentSector}
                    branch={targetBranch}
                    vendors={vendors}
                    onSave={handleCommitInventory}
                    onCancel={() => { setScannedData(null); setUploadedFile(null); }}
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
            {viewOrder && (
                <PurchaseOrderDetails
                    order={viewOrder}
                    onClose={() => setViewOrder(null)}
                    onPrint={handlePrintOrder}
                    getBranchName={getBranchName}
                    role={role || ''}
                    currentSector={currentSector || ''}
                />
            )}

            <PurchaseUpload
                handleFileUpload={handleFileUpload}
                isProcessing={isProcessing}
                error={error}
                targetBranch={targetBranch}
                setTargetBranch={setTargetBranch}
                role={role || ''}
                currentBranch={currentBranch || ''}
                tenants={tenants}
                tenantId={tenantId}
            />

            <PurchaseHistory
                sectorOrders={sectorOrders}
                setViewOrder={setViewOrder}
                getBranchName={getBranchName}
                role={role || ''}
                onApprove={(order) => dispatch(processPurchaseApproval(order))}
            />
        </div>
    );
};

export default PurchaseManager;

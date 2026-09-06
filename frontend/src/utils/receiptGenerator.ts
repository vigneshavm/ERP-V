import { Sale } from "../types/sales";
import { Tenant, Branch } from "../types/tenant";
import {
    ReceiptJSON,
    ReceiptItem,
    ReceiptOptions
} from "../types/receipt";

// --- Generator Function ---

export const generateReceiptJSON = (
    sale: Sale,
    tenant: Tenant,
    branch: Branch,
    options?: ReceiptOptions
): ReceiptJSON => {

    // 1. Extract Header Info
    // Fallback to tenant address if branch address is missing, though branch usually has one.
    const storeAddress = branch.address || tenant.companyDetails?.addressLine1 || '';
    // Construct full address string if needed, but the prompt example shows a single line/block. 
    // We'll use the basic string for now.

    // Phone
    const storePhone = branch.phone || tenant.companyDetails?.phone || '';

    // GSTIN
    // GSTIN - Branch overrides Tenant usually but types don't show it in config. 
    // Checking if branch object itself has it (custom extension?) or just use tenant.
    // Based on types, use Tenant.
    const gstin = tenant.taxDetails?.gstin || '33AFNPA6099M1ZZ';

    // 2. Transaction Details
    const dateObj = new Date(sale.date);
    const dateStr = dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: true }); // HH:MM:SS AM/PM

    // Bill Number - extract numerical part if possible or use full ID
    // Example ID: "A42-206704" -> Bill No: "206704"
    const billNoParts = sale.id.split('-');
    const billNo = billNoParts.length > 1 ? billNoParts.slice(1).join('-') : sale.id;
    const cashNo = billNoParts.length > 1 ? billNoParts[0] : (sale.counterId || 'A1');

    // 3. Items
    const items: ReceiptItem[] = sale.items.map(item => {
        const itemDiscount = item.discount || 0;
        return {
            name: item.name,
            // Rate should probably be price before tax if tax is exclusive, or inclusive. 
            // The prompt matches specific rate/amount. 
            // Assuming item.price is the rate.
            rate: item.price,
            mtr: item.cutLength || 0,
            quantity: item.qty,
            amount: item.price * item.qty,
            discount: itemDiscount
        };
    });

    // 4. Totals
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const itemDiscountsTotal = sale.items.reduce((sum: number, item: any) => sum + ((item.discount || 0) * (item.qty || 1)), 0);
    const billDiscount = sale.discountAmount || (sale as any).discount || 0;
    const redemptionDiscount = sale.redemptionAmount || 0;
    const discountTotal = itemDiscountsTotal + billDiscount + redemptionDiscount;
    const grossTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const subtotal = sale.subtotal ?? (discountTotal > 0 ? grossTotal : sale.total);
    const finalTotal = sale.total;
    const netTotal = finalTotal;

    // 5. Dynamic GST Breakdown — group items by GST rate slab
    // Each cart item may carry gstRate + gstPercentage for backward compat
    interface GSTSlab { rate: number; taxableValue: number; cgst: number; sgst: number; }
    const slabMap = new Map<number, GSTSlab>();

    for (const cartItem of sale.items) {
        const gstRate = cartItem.gstRate ?? (cartItem as any).gstPercentage ?? 5;
        const lineTotal = (cartItem.price ?? 0) * (cartItem.qty ?? 1);

        let taxableValue: number;
        let taxAmount: number;
        if (sale.taxMode === 'EXCLUSIVE') {
            taxableValue = lineTotal;
            taxAmount = lineTotal * (gstRate / 100);
        } else {
            // Inclusive — reverse calculate
            taxableValue = lineTotal / (1 + gstRate / 100);
            taxAmount = lineTotal - taxableValue;
        }

        const cgst = taxAmount / 2;
        const sgst = taxAmount / 2;

        const existing = slabMap.get(gstRate) ?? { rate: gstRate, taxableValue: 0, cgst: 0, sgst: 0 };
        existing.taxableValue += taxableValue;
        existing.cgst         += cgst;
        existing.sgst         += sgst;
        slabMap.set(gstRate, existing);
    }

    const gstSlabs: GSTSlab[] = Array.from(slabMap.values()).map(s => ({
        rate:         s.rate,
        taxableValue: +s.taxableValue.toFixed(2),
        cgst:         +s.cgst.toFixed(2),
        sgst:         +s.sgst.toFixed(2),
    }));

    // Keep a single-slab summary for backward compat (dominant slab or first)
    const primarySlab = gstSlabs[0] ?? { rate: 0, taxableValue: finalTotal, cgst: 0, sgst: 0 };

    // 6. Footer
    const footerMessage1 = options?.footerMessage1 || "மஞ்சள் வைத்த துணிகள் மற்றும் தள்ளுபடி விலையில் விற்ற துணிகளை மாற்ற இயலாது.";
    const footerMessage2 = options?.footerMessage2 || "நன்றி மீண்டும் வருக";

    return {
        receipt_data: {
            header: {
                store_name: tenant.name || branch.name,
                store_address: storeAddress,
                store_phone: storePhone,
                gstin: gstin,
                logo_url: "/images/vijayalaxmi-invoice-header.jpg"
            },
            transaction_details: {
                cash_no: cashNo,
                date: dateStr,
                time: timeStr,
                bill_no: billNo,
                customer_name: sale.customerName || 'KATE'
            },
            items: items,
            totals: {
                subtotal: +subtotal.toFixed(2),
                discount_total: +discountTotal.toFixed(2),
                net_total: netTotal,
                final_total: finalTotal,
                total_quantity: totalQuantity
            },
            tax_details: {
                gst_percentage: primarySlab.rate,
                taxable_value:  primarySlab.taxableValue,
                cgst_amount:    primarySlab.cgst,
                sgst_amount:    primarySlab.sgst,
                // Extended: all slabs for multi-rate receipts
                gst_slabs:      gstSlabs,
            },
            footer: {
                message_1: footerMessage1,
                message_2: footerMessage2
            }
        },
        printing_instructions: {
            font: "Monospaced / Thermal Printer Font",
            alignment: "Center for Header and Footer, Left for Item Details, Right for Amounts",
            special_elements: [
                "Include store logo image at the top",
                "Use bold for Store Name, Final Total, and Total Quantity",
                "Insert separator lines (dashes) as shown in the original receipt"
            ]
        }
    };
};

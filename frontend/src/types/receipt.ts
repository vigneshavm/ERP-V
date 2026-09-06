export interface ReceiptHeader {
    store_name: string;
    store_address: string;
    store_phone: string;
    gstin?: string;
    logo_url?: string;
}

export interface TransactionDetails {
    cash_no?: string; // Counter/Terminal
    date: string;
    time: string;
    bill_no: string;
    customer_name?: string;
}

export interface ReceiptItem {
    name: string;
    rate: number;
    mtr?: number; // Meter/Cut Length
    quantity: number;
    amount: number;
    discount?: number;
}

export interface ReceiptTotals {
    subtotal?: number;
    discount_total?: number;
    net_total: number;
    final_total: number;
    total_quantity: number;
}

export interface ReceiptTaxDetails {
    gst_percentage: number;
    taxable_value: number;
    cgst_amount: number;
    sgst_amount: number;
    // Extended: one entry per GST rate slab (multi-rate receipts)
    gst_slabs?: {
        rate: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
    }[];
}

export interface ReceiptFooter {
    message_1: string;
    message_2: string;
}

export interface PrintingInstructions {
    font: string;
    alignment: string;
    special_elements: string[];
}

export interface ReceiptData {
    header: ReceiptHeader;
    transaction_details: TransactionDetails;
    items: ReceiptItem[];
    totals: ReceiptTotals;
    tax_details: ReceiptTaxDetails;
    footer: ReceiptFooter;
}

export interface ReceiptJSON {
    receipt_data: ReceiptData;
    printing_instructions: PrintingInstructions;
}

export interface ReceiptOptions {
    footerMessage1?: string;
    footerMessage2?: string;
}

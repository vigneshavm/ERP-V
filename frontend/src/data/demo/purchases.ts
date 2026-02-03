import { Purchase } from "../../types/purchase";

export const purchases: Purchase[] = [
    {
        id: "PUR0001",
        po_number: "PUR-TEN001-0001",
        vendor_name: "SUP001", // Should probably be a name but SUP001 is provided as ID
        vendor_id: "SUP001",
        po_date: "2025-12-10",
        items: [
            {
                product_id: "P001",
                product_name: "Leather Jacket Brown L (BR001)",
                quantity: 10,
                rate: 1760,
                tax_percent: 18,
                discount_amount: 0,
                line_total: 17600
            }
        ],
        total_amount: 18480,
        status: "Converted",
        created_at: "2025-12-10"
    }
];
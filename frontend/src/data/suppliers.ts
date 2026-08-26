export interface MockSupplier {
    id: string;
    tenant_id: string;
    name: string;
    gst_number: string;
    phone: string;
    is_active: boolean;
    balance: number;
    credit_limit: number;
    category: string;
}

export const suppliers: MockSupplier[] = [
    { 
        id: "SUP001", 
        tenant_id: "TEN001", 
        name: "ABC Fabrics Chennai", 
        gst_number: "33ABCDE1234F1Z5", 
        phone: "9840012345",
        is_active: true,
        balance: 142500,
        credit_limit: 200000,
        category: "RAW_MATERIAL"
    },
    { 
        id: "SUP002", 
        tenant_id: "TEN001", 
        name: "South Yarn Mills Ltd", 
        gst_number: "33YARN9988L1Z2", 
        phone: "9841098765",
        is_active: true,
        balance: 85000,
        credit_limit: 150000,
        category: "YARN"
    },
    { 
        id: "SUP003", 
        tenant_id: "TEN002", 
        name: "Global Grocery Supplies", 
        gst_number: "33GLOBE7766K1Z9", 
        phone: "9000011111",
        is_active: false,
        balance: 0,
        credit_limit: 500000,
        category: "FMCG"
    }
];

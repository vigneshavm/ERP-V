import { Vendor } from '../../types/vendor';

export const suppliers: Vendor[] = [
    {
        id: "S001",
        tenantId: "TEN001",
        businessName: "ABC Fabrics Chennai",
        contactPersonName: "Ramesh Gupta",
        contactNo: "9840012345",
        email: "accounts@abcfabrics.com",
        physicalAddress: "123, Anna Salai, Chennai, Tamil Nadu",
        gstNo: "33ABCDE1234F1Z5",
        supplierType: "manufacturer",
        openingBalance: 50000,
        balanceType: "payable",
        creditPeriod: 45,
        status: "active",
        isActive: true, // Legacy
        currentBalance: 0
    },
    {
        id: "S002",
        tenantId: "TEN001",
        businessName: "South Yarn Mills Ltd",
        contactPersonName: "Senthil Kumar",
        contactNo: "9841098765",
        email: "sales@southyarn.com",
        physicalAddress: "45, Industrial Estate, Coimbatore, Tamil Nadu",
        gstNo: "33YARN9988L1Z2",
        supplierType: "wholesaler",
        openingBalance: 12000,
        balanceType: "payable",
        creditPeriod: 30,
        status: "active",
        isActive: true,
        currentBalance: 0
    }
];

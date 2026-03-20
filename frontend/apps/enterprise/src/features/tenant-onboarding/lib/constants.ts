import { ModuleType, Sector } from '@repo/shared';
import { TenantLocation } from '@/entities/session/model/core';

export const INITIAL_TENANT_STATE: any = {
    name: '',
    subdomain: '',
    modules: [] as ModuleType[],
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    sector: Sector.GENERAL,
    theme: 'light' as const,
    layout: 'standard' as const,
    domain: '',
    loginLogoUrl: '',
    loginBgUrl: '',
    locations: [] as TenantLocation[],
    initialBranch: { 
        code: 'HO', 
        name: 'Head Office', 
        address: '', 
        warehouse: 'Main Warehouse' 
    },
    adminUser: { 
        name: '', 
        mobile: '', 
        password: '', 
        role: 'SUPER_USER' 
    },
    integrations: { 
        paymentGatewayKey: '', 
        smsProviderKey: '', 
        emailProviderKey: '', 
        webhookUrl: '' 
    },
    businessType: '',
    natureOfBusiness: '',
    tradeDescription: '',
    companyDetails: { 
        addressLine1: '', addressLine2: '', city: '', state: '', stateCode: '', 
        country: 'India', pincode: '', phone: '', alternatePhone: '', email: '', website: '' 
    },
    taxDetails: { 
        taxSystem: 'GST' as const, gstin: '', pan: '', isGstEnabled: true, 
        isEInvoiceEnabled: false, isEWayBillEnabled: false 
    },
    bankingDetails: { 
        bankName: '', accountNumber: '', accountHolderName: '', ifsc: '', 
        booksStartDate: new Date().toISOString().split('T')[0], financialYearClosing: '03-31' 
    },
    systemConfig: { 
        isPosEnabled: true, isInventoryEnabled: true, isLoyaltyEnabled: false, 
        isMultiBranch: false, isEcommerceEnabled: false, pricingMode: 'EXCLUSIVE' as const 
    },
};

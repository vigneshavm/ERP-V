import { Request, Response } from "express";
import Tenant from "../models/Tenant.js";

// Extend Request type to include tenantId (added by middleware)
interface AuthenticatedRequest extends Request {
    tenantId?: string;
}

// Top-level Tenant fields the Settings page is allowed to update directly.
// Kept as an explicit allow-list so an update request can never smuggle in
// changes to fields like `status`, `subscriptionPlan`, `ownerId`, etc.
const SIMPLE_FIELDS = [
    'businessType', 'sector', 'primaryColor', 'loginLogoUrl',
    'loginBgUrl', 'theme', 'defaultTaxMode', 'gstNumber', 'panNumber'
] as const;

// Nested sub-documents that are shallow-merged so a partial update (e.g. only
// `city` changing) never wipes out sibling keys already saved on the tenant.
const NESTED_FIELDS = ['companyDetails', 'taxDetails', 'bankingDetails', 'systemConfig'] as const;

function toPlainObject(value: any): Record<string, any> {
    if (!value) return {};
    if (typeof value.toObject === 'function') return value.toObject();
    return value;
}

function enabledModulesToObject(enabledModules: any): Record<string, boolean> | undefined {
    if (!enabledModules) return undefined;
    if (enabledModules instanceof Map) return Object.fromEntries(enabledModules);
    return enabledModules;
}

// Single source of truth for what the frontend receives from GET /api/settings
// and from the `data` field of PUT /api/settings's response. New nested fields
// take priority; legacy flat fields (`address`, `contact`, `gstNumber`, etc.)
// are used as a fallback so tenants created before this change still show
// their existing values instead of blanks.
function serializeTenant(tenant: any) {
    const companyDetails = toPlainObject(tenant.companyDetails);
    const taxDetails = toPlainObject(tenant.taxDetails);
    const bankingDetails = toPlainObject(tenant.bankingDetails);
    const systemConfig = toPlainObject(tenant.systemConfig);

    return {
        id: tenant._id,
        name: tenant.name,
        appName: tenant.name,
        shopName: tenant.shopName,
        businessType: tenant.businessType || "",
        sector: tenant.sector || "",
        primaryColor: tenant.primaryColor || tenant.config?.theme?.primaryColor || "",
        loginLogoUrl: tenant.loginLogoUrl || tenant.config?.theme?.logoUrl || "",
        loginBgUrl: tenant.loginBgUrl || "",
        theme: tenant.theme || "",
        companyDetails: {
            addressLine1: companyDetails.addressLine1 ?? tenant.address?.street ?? "",
            city: companyDetails.city ?? tenant.address?.city ?? "",
            state: companyDetails.state ?? tenant.address?.state ?? "",
            pincode: companyDetails.pincode ?? tenant.address?.zipCode ?? "",
            country: companyDetails.country ?? tenant.address?.country ?? "India",
            stateCode: companyDetails.stateCode ?? "",
            phone: companyDetails.phone ?? tenant.contact?.phone ?? "",
            email: companyDetails.email ?? tenant.contact?.email ?? "",
            website: companyDetails.website ?? tenant.contact?.website ?? ""
        },
        taxDetails: {
            gstin: taxDetails.gstin ?? tenant.gstNumber ?? "",
            pan: taxDetails.pan ?? tenant.panNumber ?? "",
            taxSystem: taxDetails.taxSystem ?? "GST",
            isGstEnabled: taxDetails.isGstEnabled ?? true
        },
        bankingDetails: {
            bankName: bankingDetails.bankName ?? "",
            accountNumber: bankingDetails.accountNumber ?? "",
            ifsc: bankingDetails.ifsc ?? "",
            accountHolderName: bankingDetails.accountHolderName ?? ""
        },
        systemConfig: {
            pricingMode: systemConfig.pricingMode ?? tenant.defaultTaxMode ?? "EXCLUSIVE"
        },
        defaultTaxMode: tenant.defaultTaxMode || "",
        enabledModules: enabledModulesToObject(tenant.enabledModules),
        // Legacy flat aliases, retained for any older consumer that still reads them
        addressLine1: companyDetails.addressLine1 ?? tenant.address?.street ?? "",
        city: companyDetails.city ?? tenant.address?.city ?? "",
        state: companyDetails.state ?? tenant.address?.state ?? "",
        pincode: companyDetails.pincode ?? tenant.address?.zipCode ?? "",
        country: companyDetails.country ?? tenant.address?.country ?? "India",
        phone: companyDetails.phone ?? tenant.contact?.phone ?? "",
        email: companyDetails.email ?? tenant.contact?.email ?? "",
        website: companyDetails.website ?? tenant.contact?.website ?? ""
    };
}

export const getSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(400).json({ success: false, message: "Tenant context missing" });
        }

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }

        res.status(200).json({ success: true, data: serializeTenant(tenant) });
    } catch (error) {
        console.error("Get Settings Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: (error as Error).message });
    }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(400).json({ success: false, message: "Tenant context missing" });
        }

        const body = { ...(req.body || {}) };

        // Always scope strictly to the authenticated tenant -- never trust an
        // id/tenantId that arrived in the request body.
        delete body.tenantId;
        delete body.id;
        delete body._id;

        // Validate before touching the DB: an empty/invalid business name is
        // rejected outright rather than silently saved.
        const nameCandidate = body.name ?? body.appName;
        if (nameCandidate !== undefined && (typeof nameCandidate !== 'string' || !nameCandidate.trim())) {
            return res.status(400).json({ success: false, message: "Invalid settings: business name cannot be empty" });
        }

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }

        if (nameCandidate !== undefined) {
            tenant.name = nameCandidate.trim();
        }

        for (const field of SIMPLE_FIELDS) {
            if (body[field] !== undefined) {
                (tenant as any)[field] = body[field];
            }
        }

        for (const field of NESTED_FIELDS) {
            if (body[field] !== undefined && typeof body[field] === 'object' && body[field] !== null) {
                (tenant as any)[field] = { ...toPlainObject((tenant as any)[field]), ...body[field] };
                if (typeof (tenant as any).markModified === 'function') {
                    (tenant as any).markModified(field);
                }
            }
        }

        if (body.enabledModules !== undefined && typeof body.enabledModules === 'object' && body.enabledModules !== null) {
            tenant.enabledModules = body.enabledModules;
            if (typeof (tenant as any).markModified === 'function') {
                (tenant as any).markModified('enabledModules');
            }
        }

        // Sync legacy flat fields & systemConfig pricingMode
        if (body.taxDetails?.gstin !== undefined) tenant.gstNumber = body.taxDetails.gstin;
        if (body.taxDetails?.pan !== undefined) tenant.panNumber = body.taxDetails.pan;
        if (body.gstNumber !== undefined) {
            if (!tenant.taxDetails) tenant.taxDetails = {};
            tenant.taxDetails.gstin = body.gstNumber;
            tenant.gstNumber = body.gstNumber;
        }
        if (body.panNumber !== undefined) {
            if (!tenant.taxDetails) tenant.taxDetails = {};
            tenant.taxDetails.pan = body.panNumber;
            tenant.panNumber = body.panNumber;
        }
        if (body.defaultTaxMode !== undefined) {
            if (!tenant.systemConfig) tenant.systemConfig = {};
            tenant.systemConfig.pricingMode = body.defaultTaxMode;
        } else if (body.systemConfig?.pricingMode !== undefined) {
            tenant.defaultTaxMode = body.systemConfig.pricingMode;
        }

        // Legacy flat-field aliases -- accepted so older callers/tests that
        // still send the pre-existing shape keep working unchanged.
        if (!tenant.address) tenant.address = {};
        if (!tenant.contact) tenant.contact = {};
        if (body.addressLine1 !== undefined) tenant.address.street = body.addressLine1;
        if (body.city !== undefined) tenant.address.city = body.city;
        if (body.state !== undefined) tenant.address.state = body.state;
        if (body.pincode !== undefined) tenant.address.zipCode = body.pincode;
        if (body.phone !== undefined) tenant.contact.phone = body.phone;
        if (body.email !== undefined) tenant.contact.email = body.email;
        if (body.website !== undefined) tenant.contact.website = body.website;

        await tenant.save();

        res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            data: serializeTenant(tenant)
        });
    } catch (error) {
        console.error("Update Settings Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: (error as Error).message });
    }
};

export const updatePassword = async (_req: Request, res: Response) => {
    res.status(501).json({ message: "Not implemented" });
};

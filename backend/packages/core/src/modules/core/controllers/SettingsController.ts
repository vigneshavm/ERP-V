import { Request, Response } from "express";
import Tenant from "../models/Tenant.js";
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

// Extend Request type to include tenantId (added by middleware)
export const getSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>{
    const tenantId = req.tenantId;
    if (!tenantId) {
        return res.status(400).json({ success: false, message: "Tenant context missing" });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
        return res.status(404).json({ success: false, message: "Tenant not found" });
    }

    // Map database fields to frontend expected format
    const data = {
        appName: tenant.name, // or tenant.shopName depending on what user expects
        businessType: tenant.businessType || "",
        // Address
        addressLine1: tenant.address?.street || "",
        city: tenant.address?.city || "",
        state: tenant.address?.state || "",
        pincode: tenant.address?.zipCode || "",
        country: tenant.address?.country || "India",
        // Contact
        phone: tenant.contact?.phone || "",
        email: tenant.contact?.email || "",
        website: tenant.contact?.website || ""
    };

    res.status(200).json({ success: true, data });

export const updateSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>{
    const tenantId = req.tenantId;
    if (!tenantId) {
        return res.status(400).json({ success: false, message: "Tenant context missing" });
    }

    const {
        appName,
        businessType,
        addressLine1,
        city,
        state,
        pincode,
        phone,
        email,
        website
    } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
        return res.status(404).json({ success: false, message: "Tenant not found" });
    }

    // Update fields
    if (appName) tenant.name = appName;
    if (businessType) tenant.businessType = businessType;

    // Ensure objects exist
    if (!tenant.address) tenant.address = {};
    if (!tenant.contact) tenant.contact = {};

    // Update Address
    if (addressLine1 !== undefined) tenant.address.street = addressLine1;
    if (city !== undefined) tenant.address.city = city;
    if (state !== undefined) tenant.address.state = state;
    if (pincode !== undefined) tenant.address.zipCode = pincode;

    // Update Contact
    if (phone !== undefined) tenant.contact.phone = phone;
    if (email !== undefined) tenant.contact.email = email;
    if (website !== undefined) tenant.contact.website = website;

    await tenant.save();

    res.status(200).json({ success: true, message: "Settings updated successfully" });

export const updatePassword = asyncHandler(async (_req: Request, res: Response) =>{
    res.status(501).json({ message: "Not implemented" });
});

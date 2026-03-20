import { Request, Response } from "express";
import WhatsAppTemplate from "../models/WhatsAppTemplate.js";
import WhatsAppCampaign from "../models/WhatsAppCampaign.js";
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';

/**
 * @swagger
 * /api/crm/whatsapp/templates:
 *   get:
 *     summary: Get WhatsApp templates
 *     tags: [CRM - WhatsApp]
 *     security:
 *       - bearerAuth: []
 */
export const getTemplates = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const templates = await WhatsAppTemplate.find({ userId });
    res.status(200).json({
        success: true,
        data: templates
    });
});

/**
 * @swagger
 * /api/crm/whatsapp/templates:
 *   post:
 *     summary: Create WhatsApp template
 *     tags: [CRM - WhatsApp]
 *     security:
 *       - bearerAuth: []
 */
export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const { name, content, category } = req.body;

    const template = await WhatsAppTemplate.create({
        userId,
        name,
        content,
        category
    });

    res.status(201).json({
        success: true,
        data: template
    });
});

export const getCampaigns = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const campaigns = await WhatsAppCampaign.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        data: campaigns
    });
});

export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const campaignData = req.body;

    const campaign = await WhatsAppCampaign.create({
        ...campaignData,
        userId
    });

    res.status(201).json({
        success: true,
        data: campaign
    });
});

/**
 * @swagger
 * /api/crm/whatsapp/stats:
 *   get:
 *     summary: Get WhatsApp campaign statistics
 *     tags: [CRM - WhatsApp]
 *     security:
 *       - bearerAuth: []
 */
export const getStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const campaigns = await WhatsAppCampaign.find({ userId });

    const stats = campaigns.reduce((acc, curr) => {
        acc.sent += curr.sent;
        acc.delivered += curr.delivered;
        acc.read += curr.read;
        acc.failed += curr.failed;
        return acc;
    }, { sent: 0, delivered: 0, read: 0, failed: 0 });

    res.status(200).json({
        success: true,
        data: stats
    });
});

export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const { id } = req.params;
    const { name, content, category } = req.body;

    const template = await WhatsAppTemplate.findOneAndUpdate(
        { _id: id, userId },
        { name, content, category },
        { new: true }
    );

    if (!template) {
        res.status(404).json({ success: false, message: "Template not found" });
        return;
    }

    res.status(200).json({ success: true, data: template });
});

export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const { id } = req.params;

    const template = await WhatsAppTemplate.findOneAndDelete({ _id: id, userId });

    if (!template) {
        res.status(404).json({ success: false, message: "Template not found" });
        return;
    }

    res.status(200).json({ success: true, message: "Template deleted" });
});

export const sendTemplateMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const { templateId, variables } = req.body;

    const template = await WhatsAppTemplate.findOne({ _id: templateId, userId });
    if (!template) {
        res.status(404).json({ success: false, message: "Template not found" });
        return;
    }

    let messageContent = template.content;
    if (variables && typeof variables === 'object') {
        Object.keys(variables).forEach(key => {
            messageContent = messageContent.replace(new RegExp(`{{${key}}}`, 'g'), (variables as any)[key]);
        });
    }

    const campaign = await WhatsAppCampaign.create({
        userId,
        name: `Direct Message: ${template.name}`,
        templateId,
        status: 'sent',
        sent: 1,
        delivered: 1,
        read: 0,
        failed: 0
    });

    res.status(200).json({
        success: true,
        message: "Message sent successfully (simulated)",
        campaignId: campaign._id,
        content: messageContent
    });
});

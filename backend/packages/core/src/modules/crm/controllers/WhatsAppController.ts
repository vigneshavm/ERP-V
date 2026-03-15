import { Request, Response } from "express";
import WhatsAppTemplate from "../models/WhatsAppTemplate.js";
import WhatsAppCampaign from "../models/WhatsAppCampaign.js";

/**
 * @swagger
 * /api/crm/whatsapp/templates:
 *   get:
 *     summary: Get WhatsApp templates
 *     tags: [CRM - WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of templates retrieved
 */
export const getTemplates = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const templates = await WhatsAppTemplate.find({ userId });
        res.status(200).json({
            success: true,
            data: templates
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @swagger
 * /api/crm/whatsapp/templates:
 *   post:
 *     summary: Create WhatsApp template
 *     tags: [CRM - WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, content]
 *             properties:
 *               name: { type: string }
 *               content: { type: string }
 *               category: { type: string }
 *     responses:
 *       201:
 *         description: Template created successfully
 */
export const createTemplate = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
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
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getCampaigns = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const campaigns = await WhatsAppCampaign.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: campaigns
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const createCampaign = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const campaignData = req.body;

        const campaign = await WhatsAppCampaign.create({
            ...campaignData,
            userId
        });

        res.status(201).json({
            success: true,
            data: campaign
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @swagger
 * /api/crm/whatsapp/stats:
 *   get:
 *     summary: Get WhatsApp campaign statistics
 *     tags: [CRM - WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
export const getStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
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
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

import { Request, Response } from "express";
import { MetaService } from "../services/MetaService.js";
import { MetaIntegration } from "../models/MetaIntegration.js";
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

const metaService = new MetaService();

export class MetaController {

    // Get the Facebook Login URL
    getAuthUrl = (_req: Request, res: Response) => {
        const url = metaService.getLoginUrl();
        res.json({ success: true, url });

    // Handle OAuth Callback
    handleCallback = async (req: Request, res: Response) => {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: "Code is required" });
        }

        const userId = req.user!._id;
        const tokenData = await metaService.exchangeCodeForToken(code);
        const accessToken = tokenData.access_token;

        const userProfile = await metaService.getUserProfile(accessToken);

        // Upsert integration
        const integration = await MetaIntegration.findOneAndUpdate(
            { user: userId },
            {
                user: userId,
                facebookUserId: userProfile.id,
                accessToken: accessToken,
                tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
            },
            { new: true, upsert: true }
        );

        // Background fetch of pages/accounts
        this.refreshDataInternal(userId, accessToken);

        res.json({ success: true, data: integration });


    // Get Integration Status
    getStatus = async (req: Request, res: Response) => {
        const userId = req.user!._id;
        const integration = await MetaIntegration.findOne({ user: userId });

        if (!integration) {
            return res.json({ success: true, isConnected: false });
        }

        res.json({
            success: true,
            isConnected: true,
            integration: {
                facebookUserId: integration.facebookUserId,
                pagesCount: integration.connectedPages?.length || 0,
                adAccountsCount: integration.connectedPages?.length || 0
            }
        });

    // Internal method to refresh pages and ad accounts
    private async refreshDataInternal(userId: string, accessToken: string) {
        const pagesData = await metaService.getPages(accessToken);
        const pages = pagesData.data.map((p: any) => ({
            pageId: p.id,
            name: p.name,
            accessToken: p.access_token,
            isConnected: true,
            instagramBusinessAccountId: p.instagram_business_account?.id
        }));

        const adsData = await metaService.getAdAccounts(accessToken);
        const adAccounts = adsData.data.map((a: any) => ({
            accountId: a.id,
            name: a.name,
            isConnected: true
        }));

        const businessesData = await metaService.getWhatsAppBusinessAccounts(accessToken);
        let whatsappAccounts: any[] = [];

        if (businessesData.data) {
            businessesData.data.forEach((business: any) => {
                if (business.client_whatsapp_business_accounts?.data) {
                    business.client_whatsapp_business_accounts.data.forEach((wba: any) => {
                        whatsappAccounts.push({
                            id: wba.id,
                            name: wba.name || `WhatsApp - ${business.name}`,
                            isConnected: true
                        });
                    });
                }
            });
        }

        await MetaIntegration.findOneAndUpdate(
            { user: userId },
            {
                connectedPages: pages,
                adAccounts: adAccounts,
                whatsappBusinessAccounts: whatsappAccounts
            }
        );

    // Get Connected Pages
    getPages = async (req: Request, res: Response) => {
        const userId = req.user!._id;
        const integration = await MetaIntegration.findOne({ user: userId });
        res.json({ success: true, data: integration?.connectedPages || [] });

    // Get Ad Accounts
    getAdAccounts = async (req: Request, res: Response) => {
        const userId = req.user!._id;
        const integration = await MetaIntegration.findOne({ user: userId });
        res.json({ success: true, data: integration?.adAccounts || [] });

    // Get WhatsApp Accounts
    getWhatsAppAccounts = async (req: Request, res: Response) => {
        const userId = req.user!._id;
        const integration = await MetaIntegration.findOne({ user: userId });
        res.json({ success: true, data: integration?.whatsappBusinessAccounts || [] });

    // Publish Post to Instagram
    publishPost = async (req: Request, res: Response) => {
        const { instagramAccountId, imageUrl, caption } = req.body;
        const userId = req.user!._id;

        if (!instagramAccountId || !imageUrl) {
            return res.status(400).json({ success: false, message: "Instagram Account ID and Image URL are required" });
        }

        const integration = await MetaIntegration.findOne({ user: userId });
        if (!integration) {
            return res.status(404).json({ success: false, message: "Meta integration not found" });
        }

        const associatedPage = integration.connectedPages?.find(
            p => p.instagramBusinessAccountId === instagramAccountId
        );

        if (!associatedPage || !associatedPage.accessToken) {
            return res.status(400).json({ success: false, message: "Page Access Token not found for this Instagram Account." });
        }

        const result = await metaService.publishInstagramPhoto(
            instagramAccountId,
            imageUrl,
            caption || "",
            associatedPage.accessToken
        );

        res.json({ success: true, data: result });


    // Webhook Verification
    verifyWebhook = (req: Request, res: Response) => {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            } else {
                res.sendStatus(403);
            }
        } else {
            res.sendStatus(400);
        }
    }

    // Handle Webhook Events
    handleWebhook = (req: Request, res: Response) => {
        const body = req.body;

        if (body.object === 'page' || body.object === 'instagram') {
            body.entry?.forEach((entry: any) => {
                console.log("Meta Webhook Event:", JSON.stringify(entry));
            });
            res.status(200).send('EVENT_RECEIVED');
        } else {
            res.sendStatus(404);
        }
    }
}

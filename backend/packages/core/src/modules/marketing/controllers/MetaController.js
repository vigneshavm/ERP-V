import { MetaService } from "../services/MetaService.js";
import { MetaIntegration } from "../models/MetaIntegration.js";
const metaService = new MetaService();
export class MetaController {
    // Get the Facebook Login URL
    getAuthUrl = (_req, res) => {
        try {
            const url = metaService.getLoginUrl();
            res.json({ success: true, url });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    };
    // Handle OAuth Callback
    handleCallback = async (req, res) => {
        try {
            const { code } = req.body;
            if (!code) {
                return res.status(400).json({ success: false, message: "Code is required" });
            }
            const userId = req.user._id;
            const tokenData = await metaService.exchangeCodeForToken(code);
            const accessToken = tokenData.access_token;
            const userProfile = await metaService.getUserProfile(accessToken);
            // Upsert integration
            const integration = await MetaIntegration.findOneAndUpdate({ user: userId }, {
                user: userId,
                facebookUserId: userProfile.id,
                accessToken: accessToken,
                tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
            }, { new: true, upsert: true });
            // Background fetch of pages/accounts
            this.refreshDataInternal(userId, accessToken);
            res.json({ success: true, data: integration });
        }
        catch (error) {
            console.error("Meta Auth Error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    };
    // Get Integration Status
    getStatus = async (req, res) => {
        try {
            const userId = req.user._id;
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    };
    // Internal method to refresh pages and ad accounts
    async refreshDataInternal(userId, accessToken) {
        try {
            const pagesData = await metaService.getPages(accessToken);
            const pages = pagesData.data.map((p) => ({
                pageId: p.id,
                name: p.name,
                accessToken: p.access_token,
                isConnected: true,
                instagramBusinessAccountId: p.instagram_business_account?.id
            }));
            const adsData = await metaService.getAdAccounts(accessToken);
            const adAccounts = adsData.data.map((a) => ({
                accountId: a.id,
                name: a.name,
                isConnected: true
            }));
            const businessesData = await metaService.getWhatsAppBusinessAccounts(accessToken);
            let whatsappAccounts = [];
            if (businessesData.data) {
                businessesData.data.forEach((business) => {
                    if (business.client_whatsapp_business_accounts?.data) {
                        business.client_whatsapp_business_accounts.data.forEach((wba) => {
                            whatsappAccounts.push({
                                id: wba.id,
                                name: wba.name || `WhatsApp - ${business.name}`,
                                isConnected: true
                            });
                        });
                    }
                });
            }
            await MetaIntegration.findOneAndUpdate({ user: userId }, {
                connectedPages: pages,
                adAccounts: adAccounts,
                whatsappBusinessAccounts: whatsappAccounts
            });
        }
        catch (error) {
            console.error("Error refreshing Meta data:", error);
        }
    }
    // Get Connected Pages
    getPages = async (req, res) => {
        try {
            const userId = req.user._id;
            const integration = await MetaIntegration.findOne({ user: userId });
            res.json({ success: true, data: integration?.connectedPages || [] });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    };
    // Get Ad Accounts
    getAdAccounts = async (req, res) => {
        try {
            const userId = req.user._id;
            const integration = await MetaIntegration.findOne({ user: userId });
            res.json({ success: true, data: integration?.adAccounts || [] });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    };
    // Get WhatsApp Accounts
    getWhatsAppAccounts = async (req, res) => {
        try {
            const userId = req.user._id;
            const integration = await MetaIntegration.findOne({ user: userId });
            res.json({ success: true, data: integration?.whatsappBusinessAccounts || [] });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    };
    // Publish Post to Instagram
    publishPost = async (req, res) => {
        try {
            const { instagramAccountId, imageUrl, caption } = req.body;
            const userId = req.user._id;
            if (!instagramAccountId || !imageUrl) {
                return res.status(400).json({ success: false, message: "Instagram Account ID and Image URL are required" });
            }
            const integration = await MetaIntegration.findOne({ user: userId });
            if (!integration) {
                return res.status(404).json({ success: false, message: "Meta integration not found" });
            }
            const associatedPage = integration.connectedPages?.find(p => p.instagramBusinessAccountId === instagramAccountId);
            if (!associatedPage || !associatedPage.accessToken) {
                return res.status(400).json({ success: false, message: "Page Access Token not found for this Instagram Account." });
            }
            const result = await metaService.publishInstagramPhoto(instagramAccountId, imageUrl, caption || "", associatedPage.accessToken);
            res.json({ success: true, data: result });
        }
        catch (error) {
            console.error("Publish Error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    };
    // Webhook Verification
    verifyWebhook = (req, res) => {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode && token) {
            if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            }
            else {
                res.sendStatus(403);
            }
        }
        else {
            res.sendStatus(400);
        }
    };
    // Handle Webhook Events
    handleWebhook = (req, res) => {
        const body = req.body;
        if (body.object === 'page' || body.object === 'instagram') {
            body.entry?.forEach((entry) => {
                console.log("Meta Webhook Event:", JSON.stringify(entry));
            });
            res.status(200).send('EVENT_RECEIVED');
        }
        else {
            res.sendStatus(404);
        }
    };
}

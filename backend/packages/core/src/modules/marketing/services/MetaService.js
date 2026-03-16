// MetaIntegration model is used by MetaController, not directly here
// import { MetaIntegration } from "../models/MetaIntegration.js";
const GRAPH_API_URL = "https://graph.facebook.com/v19.0";
export class MetaService {
    appId;
    appSecret;
    redirectUri;
    constructor() {
        this.appId = process.env.META_APP_ID || "";
        this.appSecret = process.env.META_APP_SECRET || "";
        this.redirectUri = process.env.META_REDIRECT_URI || "";
        if (!this.appId || !this.appSecret) {
            console.warn("Meta credentials (META_APP_ID, META_APP_SECRET) are missing.");
        }
    }
    getLoginUrl() {
        const scopes = [
            "email",
            "public_profile",
            "pages_show_list",
            "pages_read_engagement",
            "pages_manage_posts",
            "pages_manage_metadata",
            "instagram_basic",
            "instagram_manage_comments",
            "instagram_manage_insights",
            "ads_management",
            "ads_read",
            "whatsapp_business_management",
            "whatsapp_business_messaging"
        ].join(",");
        return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${this.appId}&redirect_uri=${this.redirectUri}&scope=${scopes}&response_type=code`;
    }
    async exchangeCodeForToken(code) {
        const url = `${GRAPH_API_URL}/oauth/access_token?client_id=${this.appId}&redirect_uri=${this.redirectUri}&client_secret=${this.appSecret}&code=${code}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }
        return data;
    }
    async getUserProfile(accessToken) {
        const url = `${GRAPH_API_URL}/me?fields=id,name,email&access_token=${accessToken}`;
        const response = await fetch(url);
        return await response.json();
    }
    async getPages(accessToken) {
        const url = `${GRAPH_API_URL}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`;
        const response = await fetch(url);
        return await response.json();
    }
    async getAdAccounts(accessToken) {
        const url = `${GRAPH_API_URL}/me/adaccounts?fields=id,name,account_id,currency,account_status&access_token=${accessToken}`;
        const response = await fetch(url);
        return await response.json();
    }
    // Note: To get WhatsApp accounts, we typically query the business manager or specific WBAs if the user has granular permissions.
    // For now, simpler implementation: fetching businesses associated with the user.
    async getBusinesses(accessToken) {
        const url = `${GRAPH_API_URL}/me/businesses?fields=id,name,created_time&access_token=${accessToken}`;
        const response = await fetch(url);
        return await response.json();
    }
    async getWhatsAppBusinessAccounts(accessToken) {
        const url = `${GRAPH_API_URL}/me/businesses?fields=id,name,created_time,client_whatsapp_business_accounts{id,name,currency}&access_token=${accessToken}`;
        const response = await fetch(url);
        return await response.json();
    }
    async publishInstagramPhoto(instagramAccountId, imageUrl, caption, accessToken) {
        // Step 1: Create Media Container
        const containerUrl = `${GRAPH_API_URL}/${instagramAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;
        const containerResponse = await fetch(containerUrl, { method: 'POST' });
        const containerData = await containerResponse.json();
        if (containerData.error) {
            throw new Error(`Error creating media container: ${containerData.error.message}`);
        }
        const creationId = containerData.id;
        // Step 2: Publish Media
        const publishUrl = `${GRAPH_API_URL}/${instagramAccountId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
        const publishResponse = await fetch(publishUrl, { method: 'POST' });
        const publishData = await publishResponse.json();
        if (publishData.error) {
            throw new Error(`Error publishing media: ${publishData.error.message}`);
        }
        return publishData;
    }
}

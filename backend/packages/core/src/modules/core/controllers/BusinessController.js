import BusinessProfile from "../models/BusinessProfile.js";
import Tenant from "../models/Tenant.js";
import Sector from "../models/Sector.js";
import BusinessType from "../models/BusinessType.js";
/**
 * @swagger
 * /api/business/setup:
 *   get:
 *     summary: Get business setup status and data
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 */
export const getSetupStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        let profile = await BusinessProfile.findOne({ userId });
        if (!profile) {
            profile = await BusinessProfile.create({
                userId,
                businessName: req.user.shopName || "My Business",
                email: req.user.email,
                phone: req.user.phone || "",
            });
        }
        const setupData = {
            businessName: profile.businessName,
            category: profile.category,
            businessType: profile.businessType,
            phone: profile.phone,
            isSetupComplete: !!(profile.category && profile.businessType)
        };
        res.status(200).json({
            success: true,
            data: setupData
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * @swagger
 * /api/business/setup:
 *   post:
 *     summary: Complete business setup
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 */
export const completeSetup = async (req, res) => {
    try {
        const userId = req.user._id;
        const { businessName, category, businessType, phone } = req.body;
        const profile = await BusinessProfile.findOneAndUpdate({ userId }, {
            $set: {
                businessName,
                category,
                businessType,
                phone,
            }
        }, { new: true, runValidators: true, upsert: true });
        res.status(200).json({
            success: true,
            message: "Business setup completed successfully",
            data: profile
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * @swagger
 * /api/business/profile:
 *   get:
 *     summary: Get business profile
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business profile retrieved
 *       404:
 *         description: Profile not found
 */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        let profile = await BusinessProfile.findOne({ userId });
        if (!profile) {
            // Create a default profile if not found
            profile = await BusinessProfile.create({
                userId,
                businessName: req.user.shopName || "My Business",
                email: req.user.email,
                phone: req.user.phone || "",
                address: req.user.shopAddress || ""
            });
        }
        // Fetch Tenant to get structured address
        const tenant = await Tenant.findById(req.user.tenantId);
        const responseData = {
            ...profile.toObject(),
            tenantAddress: tenant?.address || null,
            gstNumber: tenant?.subscriptionPlan ? "" : req.user.gstNumber // Placeholder logic
        };
        res.status(200).json({
            success: true,
            data: responseData
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * @swagger
 * /api/business/profile:
 *   put:
 *     summary: Update business profile
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName: { type: string }
 *               category: { type: string }
 *               businessType: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const profileData = req.body;
        const profile = await BusinessProfile.findOneAndUpdate({ userId }, { $set: profileData }, { new: true, runValidators: true, upsert: true });
        res.status(200).json({
            success: true,
            data: profile
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * @swagger
 * /api/business/sync-google:
 *   post:
 *     summary: Sync with Google Business Profile
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google Business Profile successfully synced
 *       404:
 *         description: Business profile not found
 */
export const syncGoogle = async (req, res) => {
    try {
        const userId = req.user._id;
        // In a real app, this would exchange tokens and fetch from GMB API
        // Removing simulated data for now
        const simulatedInsights = {
            views: 0,
            calls: 0,
            directions: 0,
            websiteClicks: 0
        };
        const simulatedCompleteness = 0;
        const profile = await BusinessProfile.findOneAndUpdate({ userId }, {
            $set: {
                insights: simulatedInsights,
                completeness: simulatedCompleteness,
                isConnected: true,
                verified: false,
                lastSyncAt: new Date(),
                reviews: [],
                posts: [],
                photos: []
            }
        }, { new: true });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Business profile not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Google Business Profile sync initiated (Real API integration pending).",
            data: profile
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * @swagger
 * /api/business/types:
 *   get:
 *     summary: Get available business types
 *     tags: [Business]
 *     responses:
 *       200:
 *         description: List of business types
 */
export const getBusinessTypes = async (_req, res) => {
    try {
        const types = await BusinessType.find({ isActive: true }).sort({ name: 1 });
        const formattedTypes = types.map(t => ({
            id: t._id,
            name: t.name,
            slug: t.slug
        }));
        res.status(200).json({
            success: true,
            data: formattedTypes
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * @swagger
 * /api/business/reviews/{reviewId}/reply:
 *   post:
 *     summary: Reply to a review
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reply: { type: string }
 */
export const replyToReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { reviewId } = req.params;
        const { reply } = req.body;
        const profile = await BusinessProfile.findOne({ userId });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Business profile not found"
            });
        }
        const review = profile.reviews.find(r => r._id.toString() === reviewId || r.reviewer === reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }
        review.reply = reply;
        await profile.save();
        res.status(200).json({
            success: true,
            message: "Reply posted successfully",
            data: review
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * @swagger
 * /api/business/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *               type: { type: string, enum: [OFFER, EVENT, UPDATE] }
 *               imageUrl: { type: string }
 */
export const createPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { content, type, imageUrl } = req.body;
        const newPost = {
            content,
            type: type || 'UPDATE',
            imageUrl: imageUrl || "",
            views: 0,
            clicks: 0,
            date: new Date()
        };
        const profile = await BusinessProfile.findOneAndUpdate({ userId }, { $push: { posts: { $each: [newPost], $position: 0 } } }, { new: true });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Business profile not found"
            });
        }
        res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: profile.posts[0]
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * @swagger
 * /api/business/sectors:
 *   get:
 *     summary: Get available business sectors
 *     tags: [Business]
 *     responses:
 *       200:
 *         description: List of business sectors
 */
export const getSectors = async (_req, res) => {
    try {
        const sectors = await Sector.find({ isActive: true }).sort({ name: 1 });
        const formattedSectors = sectors.map(s => ({
            id: s._id,
            name: s.name
        }));
        res.status(200).json({
            success: true,
            data: formattedSectors
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

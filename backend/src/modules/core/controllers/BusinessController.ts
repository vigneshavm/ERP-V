import { Request, Response } from "express";
import BusinessProfile from "../models/BusinessProfile.js";
import Sector from "../models/Sector.js";
import BusinessType from "../models/BusinessType.js";
import mongoose from "mongoose";


/**
 * @swagger
 * /api/business/setup:
 *   get:
 *     summary: Get business setup status and data
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 */
export const getSetupStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        let profile = await BusinessProfile.findOne({ userId });

        if (!profile) {
            profile = await BusinessProfile.create({
                userId,
                businessName: (req as any).user.shopName || "My Business",
                email: (req as any).user.email,
                phone: (req as any).user.phone || "",
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
    } catch (error: any) {
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
export const completeSetup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { businessName, category, businessType, phone } = req.body;

        const profile = await BusinessProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    businessName,
                    category,
                    businessType,
                    phone,
                }
            },
            { new: true, runValidators: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: "Business setup completed successfully",
            data: profile
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
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        let profile = await BusinessProfile.findOne({ userId });

        if (!profile) {
            // Create a default profile if not found
            profile = await BusinessProfile.create({
                userId,
                businessName: (req as any).user.shopName || "My Business",
                email: (req as any).user.email,
                phone: (req as any).user.phone || "",
                address: (req as any).user.shopAddress || ""
            });
        }

        res.status(200).json({
            success: true,
            data: profile
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
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const profileData = req.body;

        const profile = await BusinessProfile.findOneAndUpdate(
            { userId },
            { $set: profileData },
            { new: true, runValidators: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: profile
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
export const syncGoogle = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;

        // Simulate fetching data from Google API
        // In a real app, this would exchange tokens and fetch from GMB API
        const simulatedInsights = {
            views: Math.floor(Math.random() * 5000) + 500,
            calls: Math.floor(Math.random() * 100) + 10,
            directions: Math.floor(Math.random() * 200) + 20,
            websiteClicks: Math.floor(Math.random() * 300) + 50
        };

        const simulatedCompleteness = 85;

        // Mock Reviews
        const mockReviews = [
            {
                reviewer: "Arun Kumar",
                rating: 5,
                comment: "Excellent service and great collection! consistent quality.",
                reply: "Thank you Arun! We look forward to serving you again.",
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                profilePhoto: ""
            },
            {
                reviewer: "Priya S",
                rating: 4,
                comment: "Good variety but parking was difficult.",
                reply: "",
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                profilePhoto: ""
            },
            {
                reviewer: "David Wilson",
                rating: 5,
                comment: "Best place in town for authentic wear.",
                reply: "Thanks David!",
                date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                profilePhoto: ""
            }
        ];

        // Mock Posts
        const mockPosts = [
            {
                content: "New Summer Collection is here! Visit us for exclusive discounts.",
                type: "OFFER",
                views: 1250,
                clicks: 45,
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                imageUrl: "https://placehold.co/300x200/e0e7ff/4338ca?text=Summer+Sale"
            },
            {
                content: "We will be closed this Sunday for maintenance.",
                type: "UPDATE",
                views: 800,
                clicks: 12,
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                imageUrl: ""
            }
        ];

        const profile = await BusinessProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    insights: simulatedInsights,
                    completeness: simulatedCompleteness,
                    isConnected: true,
                    verified: true, // Assuming sync implies verification for this demo
                    lastSyncAt: new Date(),
                    reviews: mockReviews,
                    posts: mockPosts,
                    photos: [
                        { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=300", type: "Interior", uploadedAt: new Date() },
                        { url: "https://images.unsplash.com/photo-1522071823991-b19c72f140ef?auto=format&fit=crop&q=80&w=300", type: "Team", uploadedAt: new Date() },
                        { url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=300", type: "Exterior", uploadedAt: new Date() }
                    ]
                }
            },
            { new: true }
        );

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Business profile not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Google Business Profile successfully synced.",
            data: profile
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
 * /api/business/types:
 *   get:
 *     summary: Get available business types
 *     tags: [Business]
 *     responses:
 *       200:
 *         description: List of business types
 */
export const getBusinessTypes = async (_req: Request, res: Response) => {
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
    } catch (error: any) {
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
export const replyToReview = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { reviewId } = req.params;
        const { reply } = req.body;

        const profile = await BusinessProfile.findOne({ userId });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Business profile not found"
            });
        }

        const review = profile.reviews.find(r => (r as any)._id.toString() === reviewId || r.reviewer === reviewId);

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
    } catch (error: any) {
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
export const createPost = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { content, type, imageUrl } = req.body;

        const newPost = {
            content,
            type: type || 'UPDATE',
            imageUrl: imageUrl || "",
            views: 0,
            clicks: 0,
            date: new Date()
        };

        const profile = await BusinessProfile.findOneAndUpdate(
            { userId },
            { $push: { posts: { $each: [newPost], $position: 0 } } },
            { new: true }
        );

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
    } catch (error: any) {
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
export const getSectors = async (_req: Request, res: Response) => {
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
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

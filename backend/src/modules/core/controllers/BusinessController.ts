import { Request, Response } from "express";
import BusinessProfile from "../models/BusinessProfile.js";
import Sector from "../models/Sector.js";


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
                    posts: mockPosts
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
            id: s.name.toLowerCase(), // Maintain compatibility with existing ID format (lowercase)
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

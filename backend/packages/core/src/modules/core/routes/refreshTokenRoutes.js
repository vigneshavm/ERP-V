import express from "express";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import RefreshToken from "../models/RefreshToken.js";
import { generateToken, verifyRefreshToken, generateRandomToken } from '@smarterp/shared/config/jwt.js';
import User from "../models/User.js";
import { clearDeviceIdCookie, getDeviceIdFromCookie } from '@smarterp/shared/utils/deviceUtils.js';
const router = express.Router();
/**
 * POST /api/auth/refresh-token
 * Exchange a valid refresh token for a new access + refresh token pair.
 */
router.post("/", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token required" });
        }
        const storedToken = await RefreshToken.findOne({ token: refreshToken });
        if (!storedToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        if (!storedToken.isActive()) {
            return res.status(401).json({ message: "Refresh token expired or revoked" });
        }
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid refresh token signature" });
        }
        const user = await User.findById(storedToken.user).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const deviceIdFromCookie = getDeviceIdFromCookie(req);
        if (!deviceIdFromCookie || user.activeDeviceId !== deviceIdFromCookie) {
            await RefreshToken.findByIdAndUpdate(storedToken._id, {
                isRevoked: true, revokedAt: new Date()
            });
            return res.status(401).json({
                message: "Session expired. Please log in again.",
                sessionExpired: true
            });
        }
        const newAccessToken = generateToken(user._id.toString());
        const newRefreshToken = generateRandomToken();
        // Rotate: revoke old, issue new
        await Promise.all([
            RefreshToken.findByIdAndUpdate(storedToken._id, {
                isRevoked: true, revokedAt: new Date()
            }),
            RefreshToken.create({
                token: newRefreshToken,
                user: user._id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdByIp: req.ip,
                userAgent: req.headers["user-agent"],
            })
        ]);
        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: { _id: user._id, name: user.name, email: user.email, shopName: user.shopName },
        });
    }
    catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
/**
 * DELETE /api/auth/refresh-token
 * Revoke a specific refresh token (logout current device).
 * Replaces POST /revoke — DELETE is correct because we are destroying a session resource.
 */
router.delete("/", protect, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token required" });
        }
        const storedToken = await RefreshToken.findOne({
            token: refreshToken,
            user: req.user._id
        });
        if (!storedToken) {
            return res.status(404).json({ message: "Refresh token not found" });
        }
        await Promise.all([
            RefreshToken.findByIdAndUpdate(storedToken._id, {
                isRevoked: true, revokedAt: new Date()
            }),
            User.findByIdAndUpdate(req.user._id, {
                $set: { activeDeviceId: null, activeSessionCreatedAt: null }
            })
        ]);
        clearDeviceIdCookie(res);
        res.json({ message: "Session revoked successfully" });
    }
    catch (error) {
        console.error("Revoke token error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
/**
 * DELETE /api/auth/refresh-token/all
 * Revoke all refresh tokens for the authenticated user (logout all devices).
 * Replaces POST /revoke-all.
 */
router.delete("/all", protect, async (req, res) => {
    try {
        await Promise.all([
            RefreshToken.updateMany({ user: req.user._id, isRevoked: false }, { isRevoked: true, revokedAt: new Date() }),
            User.findByIdAndUpdate(req.user._id, {
                $set: { activeDeviceId: null, activeSessionCreatedAt: null }
            })
        ]);
        clearDeviceIdCookie(res);
        res.json({ message: "All sessions revoked successfully" });
    }
    catch (error) {
        console.error("Revoke all tokens error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
export default router;

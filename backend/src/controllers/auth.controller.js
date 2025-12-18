import asyncHandler from "express-async-handler";
import crypto from "crypto";
import User from "../models/User.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.js";

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

const setRefreshCookie = (res, refreshToken) => {
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error("name, email and password are required");
    }

    const existing = await User.findOne({ email });
    if (existing) {
        res.status(409);
        throw new Error("Email already registered");
    }

    const user = await User.create({ name, email, password });

    const accessToken = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        accessToken,
    });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("email and password are required");
    }

    const user = await User.findOne({ email }).select(
        "+password +refreshTokenHash"
    );
    if (!user) {
        res.status(401);
        throw new Error("Invalid credentials");
    }

    if (user.isBlocked) {
        res.status(403);
        throw new Error("User account is blocked");
    }

    const ok = await user.matchPassword(password);
    if (!ok) {
        res.status(401);
        throw new Error("Invalid credentials");
    }

    user.lastLogin = new Date();

    const accessToken = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, refreshToken);

    res.json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        accessToken,
    });
});

const refresh = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        res.status(401);
        throw new Error("No refresh token");
    }

    let decoded;
    try {
        const jwt = await import("jsonwebtoken");
        decoded = jwt.default.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
        res.status(401);
        throw new Error("Invalid refresh token");
    }

    const user = await User.findById(decoded.id).select("+refreshTokenHash");
    if (!user) {
        res.status(401);
        throw new Error("Invalid refresh token");
    }

    if (user.isBlocked) {
        res.status(403);
        throw new Error("User account is blocked");
    }

    const incomingHash = hashToken(token);
    if (!user.refreshTokenHash || incomingHash !== user.refreshTokenHash) {
        // Possible refresh token reuse or invalid token.
        // Invalidate any stored refresh token to force logout and clear cookie.
        try {
            user.refreshTokenHash = undefined;
            await user.save({ validateBeforeSave: false });
        } catch (saveErr) {
            // ignore save errors, but don't crash
            console.error('Failed to clear refreshTokenHash on reuse detection', saveErr);
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return res.status(401).json({ success: false, message: 'Refresh token reuse detected' });
    }

    const accessToken = generateToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, newRefreshToken);

    res.json({ success: true, accessToken });
});

const logout = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (token) {
        let decoded;
        try {
            const jwt = await import("jsonwebtoken");
            decoded = jwt.default.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch {
            decoded = null;
        }

        if (decoded?.id) {
            const user = await User.findById(decoded.id).select(
                "+refreshTokenHash"
            );
            if (user) {
                user.refreshTokenHash = undefined;
                await user.save({ validateBeforeSave: false });
            }
        }
    }

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    res.json({ success: true });
});

export { register, login, refresh, logout };

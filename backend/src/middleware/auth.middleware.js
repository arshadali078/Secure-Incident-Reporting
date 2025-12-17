import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import logger from "../utils/logger.js";

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                res.status(401);
                throw new Error("Not authorized, user not found");
            }

            // Check if user is blocked
            if (req.user.isBlocked) {
                res.status(403);
                throw new Error("User account is blocked");
            }

            // Log the request (only for important endpoints, not every API call)
            // This is commented out to reduce log noise - uncomment if needed for debugging
            // await AuditLog.log({
            //     action: "API_ACCESS",
            //     entity: req.user.role === "SUPER_ADMIN" ? "SuperAdmin" : req.user.role === "ADMIN" ? "Admin" : "User",
            //     entityId: req.user._id,
            //     performedBy: req.user._id,
            //     req,
            // });

            next();
        } catch (error) {
            logger.error(`Authentication error: ${error.message}`);

            // Log failed authentication attempt
            if (req.user) {
                await AuditLog.log({
                    action: "AUTH_FAILED",
                    entity: req.user.role === "SUPER_ADMIN" ? "SuperAdmin" : req.user.role === "ADMIN" ? "Admin" : "User",
                    entityId: req.user._id,
                    performedBy: req.user._id,
                    req,
                    error: new Error("Invalid or expired token"),
                });
            }

            res.status(401);
            throw new Error("Not authorized, token failed");
        }
    }

    if (!token) {
        res.status(401);
        throw new Error("Not authorized, no token");
    }
});

// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            // Log unauthorized access attempt
            AuditLog.log({
                action: "UNAUTHORIZED_ACCESS",
                entity: req.user.role === "SUPER_ADMIN" ? "SuperAdmin" : req.user.role === "ADMIN" ? "Admin" : "User",
                entityId: req.user._id,
                performedBy: req.user._id,
                req,
                error: new Error(
                    `User role ${req.user.role} is not authorized to access this route`
                ),
            });

            res.status(403);
            throw new Error(
                `User role ${req.user.role} is not authorized to access this route`
            );
        }
        next();
    };
};

// Check if user is the owner of the resource
const checkOwnership = (model) => {
    return asyncHandler(async (req, res, next) => {
        const resource = await model.findById(req.params.id);

        if (!resource) {
            res.status(404);
            throw new Error("Resource not found");
        }

        // Grant access if user is admin or super admin
        if (req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN") {
            return next();
        }

        // Check if user is the owner of the resource
        if (resource.createdBy.toString() !== req.user.id) {
            // Log unauthorized access attempt
            await AuditLog.log({
                action: "UNAUTHORIZED_ACCESS",
                entity: req.user.role === "SUPER_ADMIN" ? "SuperAdmin" : req.user.role === "ADMIN" ? "Admin" : "User",
                entityId: resource._id,
                performedBy: req.user._id,
                req,
                error: new Error("User not authorized to access this resource"),
            });

            res.status(403);
            throw new Error("User not authorized to access this resource");
        }

        next();
    });
};

export { protect, authorize, checkOwnership };

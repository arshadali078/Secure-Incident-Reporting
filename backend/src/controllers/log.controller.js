import asyncHandler from "express-async-handler";
import AuditLog from "../models/AuditLog.js";
import mongoose from "mongoose";

const listLogs = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
        Math.max(parseInt(req.query.limit || "50", 10), 1),
        200
    );
    const skip = (page - 1) * limit;

    const q = {};
    if (req.query.entity) q.entity = req.query.entity;
    if (req.query.action) q.action = req.query.action;
    if (req.query.performedBy) {
        if (mongoose.Types.ObjectId.isValid(req.query.performedBy)) {
            q.performedBy = req.query.performedBy;
        }
    }

    if (req.query.from || req.query.to) {
        q.createdAt = {};
        if (req.query.from) q.createdAt.$gte = new Date(req.query.from);
        if (req.query.to) q.createdAt.$lte = new Date(req.query.to);
    }

    // Build aggregation pipeline for role filtering
    let matchStage = { ...q };
    
    let pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "performedBy",
                foreignField: "_id",
                as: "performedByUser"
            }
        },
        { $unwind: { path: "$performedByUser", preserveNullAndEmptyArrays: true } }
    ];
    
    // Add role filter if provided
    if (req.query.userRole) {
        pipeline.push({
            $match: {
                "performedByUser.role": req.query.userRole
            }
        });
    }
    
    // Add sorting and pagination
    pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $project: {
                action: 1,
                entity: 1,
                entityId: 1,
                performedBy: {
                    _id: "$performedByUser._id",
                    name: "$performedByUser.name",
                    email: "$performedByUser.email",
                    role: "$performedByUser.role"
                },
                oldValues: 1,
                newValues: 1,
                ipAddress: 1,
                userAgent: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    );
    
    // Get total count with role filter
    let countPipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "performedBy",
                foreignField: "_id",
                as: "performedByUser"
            }
        },
        { $unwind: { path: "$performedByUser", preserveNullAndEmptyArrays: true } }
    ];
    
    if (req.query.userRole) {
        countPipeline.push({
            $match: {
                "performedByUser.role": req.query.userRole
            }
        });
    }
    
    countPipeline.push({ $count: "total" });

    const [itemsResult, totalResult] = await Promise.all([
        AuditLog.aggregate(pipeline),
        AuditLog.aggregate(countPipeline),
    ]);

    const items = itemsResult || [];
    const total = totalResult?.[0]?.total || 0;

    res.json({
        success: true,
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
    });
});

export { listLogs };

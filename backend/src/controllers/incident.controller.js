import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

import Incident from "../models/Incident.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";

const buildIncidentQuery = (req) => {
    const q = {};

    // RBAC scope
    if (req.user.role === "USER") {
        q.createdBy = req.user._id;
    }

    if (req.query.status) q.status = req.query.status;
    if (req.query.category) q.category = req.query.category;
    if (req.query.priority) q.priority = req.query.priority;
    if (req.query.assignedTo) q.assignedTo = req.query.assignedTo;
    if (req.query.createdBy && req.user.role !== "USER")
        q.createdBy = req.query.createdBy;

    if (req.query.search) {
        // Use regex for partial word matching instead of text search
        const searchRegex = { $regex: req.query.search.trim(), $options: "i" };
        q.$or = [
            { title: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
        ];
    }

    if (req.query.from || req.query.to) {
        q.createdAt = {};
        if (req.query.from) q.createdAt.$gte = new Date(req.query.from);
        if (req.query.to) q.createdAt.$lte = new Date(req.query.to);
    }

    return q;
};

const listIncidents = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
        Math.max(parseInt(req.query.limit || "20", 10), 1),
        100
    );
    const skip = (page - 1) * limit;

    const sort = req.query.sort || "-createdAt";

    const q = buildIncidentQuery(req);

    const [items, total] = await Promise.all([
        Incident.find(q)
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role")
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Incident.countDocuments(q),
    ]);

    res.json({
        success: true,
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
    });
});

const getIncident = asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id)
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

    if (!incident) {
        res.status(404);
        throw new Error("Incident not found");
    }

    if (
        req.user.role === "USER" &&
        incident.createdBy._id.toString() !== req.user._id.toString()
    ) {
        res.status(403);
        throw new Error("Access denied");
    }

    res.json({ success: true, incident });
});

const createIncident = asyncHandler(async (req, res) => {
    const { title, description, category, priority, incidentDate } = req.body;

    if (!title || !description || !category || !priority || !incidentDate) {
        res.status(400);
        throw new Error("title, description, category, priority, and incidentDate are required");
    }

    const evidenceFiles = (req.files || []).map(
        (f) => `/uploads/${f.filename}`
    );

    const incident = await Incident.create({
        title,
        description,
        category,
        priority,
        incidentDate: new Date(incidentDate),
        status: "Open",
        evidenceFiles,
        createdBy: req.user._id,
    });

    await AuditLog.log({
        action: "INCIDENT_CREATE",
        entity: "Incident",
        entityId: incident._id,
        performedBy: req.user._id,
        newValues: incident.toObject(),
        req,
    });

    // Create notifications for admins
    const admins = await User.find({ role: { $in: ["ADMIN", "SUPER_ADMIN"] } });
    const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        type: "INCIDENT_CREATED",
        title: "New Incident Reported",
        message: `A new incident "${incident.title}" has been reported by ${req.user.email}`,
        incidentId: incident._id,
    }));

    if (adminNotifications.length > 0) {
        await Notification.createNotifications(adminNotifications);
    }

    // Create notification for the creator
    await Notification.createNotification({
        user: incident.createdBy,
        type: "INCIDENT_CREATED",
        title: "Incident Created",
        message: `Your incident "${incident.title}" has been created successfully`,
        incidentId: incident._id,
    });

    // notify all users in realtime
    const io = req.app.get("io");
    const notificationData = {
        incidentId: incident._id,
        action: "ADD",
        createdBy: req.user._id,
        status: incident.status,
        title: incident.title,
        category: incident.category,
    };
    
    // Notify admins about new incident
    io?.emit("incident:new", notificationData);
    // Notify the creator
    io?.to(`user_${incident.createdBy.toString()}`).emit("incident:notification", {
        ...notificationData,
        message: `Your incident "${incident.title}" has been created successfully`,
    });

    res.status(201).json({ success: true, incident });
});

const updateIncident = asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
        res.status(404);
        throw new Error("Incident not found");
    }

    // USER: can only edit own incident and only when Open
    if (req.user.role === "USER") {
        if (incident.createdBy.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error("Access denied");
        }
        if (incident.status !== "Open") {
            res.status(400);
            throw new Error("Cannot edit incident after it is processed");
        }
        const allowed = ["title", "description", "category", "priority"];
        for (const key of allowed) {
            if (typeof req.body[key] !== "undefined")
                incident[key] = req.body[key];
        }
    } else {
        // ADMIN / SUPER_ADMIN
        const allowed = [
            "title",
            "description",
            "category",
            "priority",
            "status",
            "assignedTo",
            "resolutionNotes",
        ];
        for (const key of allowed) {
            if (typeof req.body[key] !== "undefined")
                incident[key] = req.body[key];
        }

        // validate assignedTo if provided
        if (req.body.assignedTo) {
            const exists = await User.exists({ _id: req.body.assignedTo });
            if (!exists) {
                res.status(400);
                throw new Error("assignedTo user not found");
            }
        }
    }

    const oldValues = incident.toObject();
    await incident.save();

    await AuditLog.log({
        action: "INCIDENT_UPDATE",
        entity: "Incident",
        entityId: incident._id,
        performedBy: req.user._id,
        oldValues,
        newValues: incident.toObject(),
        req,
    });

    // Determine action type based on status change
    let actionType = "UPDATE";
    let notificationType = "INCIDENT_UPDATED";
    if (oldValues.status !== incident.status) {
        if (incident.status === "Resolved") {
            actionType = "RESOLVE";
            notificationType = "INCIDENT_RESOLVED";
        } else if (incident.status === "In Progress") {
            actionType = "INPROGRESS";
            notificationType = "INCIDENT_IN_PROGRESS";
        } else if (incident.status === "Open") {
            actionType = "OPEN";
            notificationType = "INCIDENT_REOPENED";
        } else if (incident.status === "Closed") {
            actionType = "CLOSE";
            notificationType = "INCIDENT_CLOSED";
        }
    }

    // Create notification for the incident owner
    const ownerMessage = req.user.role === "USER"
        ? `Your incident "${incident.title}" has been updated`
        : `Your incident "${incident.title}" has been ${actionType.toLowerCase()}d by ${req.user.email}`;

    await Notification.createNotification({
        user: incident.createdBy,
        type: notificationType,
        title: `Incident ${actionType === "UPDATE" ? "Updated" : actionType}`,
        message: ownerMessage,
        incidentId: incident._id,
    });

    // If assigned to someone, notify them
    if (incident.assignedTo && incident.assignedTo.toString() !== req.user._id.toString()) {
        await Notification.createNotification({
            user: incident.assignedTo,
            type: "INCIDENT_ASSIGNED",
            title: "Incident Assigned",
            message: `Incident "${incident.title}" has been assigned to you`,
            incidentId: incident._id,
        });
    }

    // realtime notify all users
    const io = req.app.get("io");
    const notificationData = {
        incidentId: incident._id,
        action: actionType,
        status: incident.status,
        title: incident.title,
        updatedBy: req.user._id,
        updatedByRole: req.user.role,
    };

    // Notify the incident owner
    io?.to(`user_${incident.createdBy.toString()}`).emit("incident:notification", {
        ...notificationData,
        message: ownerMessage,
    });

    // Notify all admins about the update
    io?.emit("incident:update", notificationData);

    res.json({ success: true, incident });
});

const bulkResolve = asyncHandler(async (req, res) => {
    const { incidentIds } = req.body;
    if (!Array.isArray(incidentIds) || incidentIds.length === 0) {
        res.status(400);
        throw new Error("incidentIds array is required");
    }

    const ids = incidentIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

    const result = await Incident.updateMany(
        { _id: { $in: ids } },
        { $set: { status: "Resolved", resolvedAt: new Date() } }
    );

    await AuditLog.log({
        action: "INCIDENT_BULK_RESOLVE",
        entity: "System",
        entityId: req.user._id,
        performedBy: req.user._id,
        newValues: {
            incidentIds,
            matched: result.matchedCount,
            modified: result.modifiedCount,
        },
        req,
    });

    // Get incidents to notify owners
    const incidents = await Incident.find({ _id: { $in: ids } });
    const notifications = incidents.map((inc) => ({
        user: inc.createdBy,
        type: "BULK_RESOLVE",
        title: "Incident Resolved",
        message: `Your incident "${inc.title}" has been resolved`,
        incidentId: inc._id,
    }));

    if (notifications.length > 0) {
        await Notification.createNotifications(notifications);
    }

    // Notify about bulk resolve
    const io = req.app.get("io");
    io?.emit("incident:bulk-resolve", {
        action: "RESOLVE",
        incidentIds,
        count: result.modifiedCount,
        performedBy: req.user._id,
    });

    res.json({ success: true, result });
});

const hardDeleteIncident = asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
        res.status(404);
        throw new Error("Incident not found");
    }

    const incidentData = incident.toObject();
    await incident.deleteOne();

    await AuditLog.log({
        action: "INCIDENT_HARD_DELETE",
        entity: "Incident",
        entityId: incident._id,
        performedBy: req.user._id,
        oldValues: incidentData,
        req,
    });

    // Create notification for the creator
    await Notification.createNotification({
        user: incidentData.createdBy,
        type: "INCIDENT_DELETED",
        title: "Incident Deleted",
        message: `Your incident "${incidentData.title}" has been permanently deleted by ${req.user.email}`,
        incidentId: incident._id,
    });

    // Notify about deletion
    const io = req.app.get("io");
    io?.emit("incident:delete", {
        incidentId: incident._id,
        action: "DELETE",
        title: incidentData.title,
        deletedBy: req.user._id,
    });
    // Notify the creator
    io?.to(`user_${incidentData.createdBy.toString()}`).emit("incident:notification", {
        incidentId: incident._id,
        action: "DELETE",
        message: `Your incident "${incidentData.title}" has been permanently deleted`,
    });

    res.json({ success: true });
});

const exportCsv = asyncHandler(async (req, res) => {
    const q = buildIncidentQuery(req);
    const items = await Incident.find(q)
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email")
        .sort(req.query.sort || "-createdAt")
        .limit(5000);

    const rows = items.map((i) => ({
        id: i._id.toString(),
        title: i.title,
        category: i.category,
        priority: i.priority,
        status: i.status,
        createdAt: i.createdAt,
        resolvedAt: i.resolvedAt,
        createdBy: i.createdBy?.email,
        assignedTo: i.assignedTo?.email,
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=incidents.csv");
    res.send(csv);
});

const exportPdf = asyncHandler(async (req, res) => {
    const q = buildIncidentQuery(req);
    const items = await Incident.find(q)
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email")
        .sort(req.query.sort || "-createdAt")
        .limit(1000);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=incidents.pdf");

    const doc = new PDFDocument({ margin: 30 });
    doc.pipe(res);

    doc.fontSize(18).text("Incident Report Export", { align: "center" });
    doc.moveDown();

    items.forEach((i) => {
        doc.fontSize(12)
            .text(`Title: ${i.title}`)
            .text(
                `Category: ${i.category} | Priority: ${i.priority} | Status: ${i.status}`
            )
            .text(
                `CreatedBy: ${i.createdBy?.email || "-"} | AssignedTo: ${
                    i.assignedTo?.email || "-"
                }`
            )
            .text(`CreatedAt: ${i.createdAt}`)
            .moveDown(0.5);
    });

    doc.end();
});

const stats = asyncHandler(async (req, res) => {
    // Admin/Super only
    const totalIncidents = await Incident.countDocuments({});

    const statusAgg = await Incident.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const categoryAgg = await Incident.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    const avgResolutionAgg = await Incident.aggregate([
        { $match: { status: "Resolved", resolvedAt: { $ne: null } } },
        {
            $project: {
                ms: { $subtract: ["$resolvedAt", "$createdAt"] },
            },
        },
        { $group: { _id: null, avgMs: { $avg: "$ms" } } },
    ]);

    const avgResolutionMs = avgResolutionAgg?.[0]?.avgMs || 0;

    res.json({
        success: true,
        totalIncidents,
        statusBreakdown: statusAgg.map((s) => ({
            status: s._id,
            count: s.count,
        })),
        categoryBreakdown: categoryAgg.map((c) => ({
            category: c._id,
            count: c.count,
        })),
        avgResolutionMs,
    });
});

export {
    listIncidents,
    getIncident,
    createIncident,
    updateIncident,
    bulkResolve,
    hardDeleteIncident,
    exportCsv,
    exportPdf,
    stats,
};

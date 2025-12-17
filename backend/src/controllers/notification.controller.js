import asyncHandler from "express-async-handler";
import Notification from "../models/Notification.js";

const getNotifications = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
        Math.max(parseInt(req.query.limit || "20", 10), 1),
        100
    );
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (req.query.unreadOnly === "true") {
        query.read = false;
    }

    const [items, total, unreadCount] = await Promise.all([
        Notification.find(query)
            .populate("incidentId", "title status")
            .sort("-createdAt")
            .skip(skip)
            .limit(limit),
        Notification.countDocuments(query),
        Notification.countDocuments({ user: req.user._id, read: false }),
    ]);

    res.json({
        success: true,
        items,
        page,
        limit,
        total,
        unreadCount,
        pages: Math.ceil(total / limit),
    });
});

const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
        _id: notificationId,
        user: req.user._id,
    });

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, notification });
});

const markAllAsRead = asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
        { user: req.user._id, read: false },
        { $set: { read: true, readAt: new Date() } }
    );

    res.json({
        success: true,
        modified: result.modifiedCount,
    });
});

const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
        _id: notificationId,
        user: req.user._id,
    });

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    await notification.deleteOne();

    res.json({ success: true });
});

const deleteAllNotifications = asyncHandler(async (req, res) => {
    const result = await Notification.deleteMany({ user: req.user._id });

    res.json({
        success: true,
        deleted: result.deletedCount,
    });
});

export {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
};

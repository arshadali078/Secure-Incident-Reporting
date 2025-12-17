import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

const me = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            isBlocked: req.user.isBlocked,
        },
    });
});

const listUsers = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
        Math.max(parseInt(req.query.limit || "20", 10), 1),
        100
    );
    const skip = (page - 1) * limit;

    const q = {};
    if (req.query.role) q.role = req.query.role;
    if (typeof req.query.isBlocked !== "undefined")
        q.isBlocked = req.query.isBlocked === "true";
    if (req.query.search) {
        q.$or = [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
        ];
    }

    const [items, total] = await Promise.all([
        User.find(q)
            .sort("-createdAt")
            .skip(skip)
            .limit(limit)
            .select("-password"),
        User.countDocuments(q),
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

const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error("name, email, password are required");
    }

    const exists = await User.findOne({ email });
    if (exists) {
        res.status(409);
        throw new Error("Email already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || "USER",
    });

    await AuditLog.log({
        action: "USER_CREATE",
        entity: req.user.role === "SUPER_ADMIN" ? "User" : "User",
        entityId: user._id,
        performedBy: req.user._id,
        newValues: { name: user.name, email: user.email, role: user.role },
        req,
    });

    res.status(201).json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked,
        },
    });
});

const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("+password");
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    const oldValues = {
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
    };

    const allowed = ["name", "email", "role", "isBlocked", "password"];
    for (const key of allowed) {
        if (typeof req.body[key] !== "undefined") user[key] = req.body[key];
    }

    await user.save();

    await AuditLog.log({
        action: "USER_UPDATE",
        entity: "User",
        entityId: user._id,
        performedBy: req.user._id,
        oldValues,
        newValues: {
            name: user.name,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked,
        },
        req,
    });

    res.json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked,
        },
    });
});

const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // prevent self delete
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error("Cannot delete your own account");
    }

    await user.deleteOne();

    await AuditLog.log({
        action: "USER_DELETE",
        entity: "User",
        entityId: user._id,
        performedBy: req.user._id,
        oldValues: {
            name: user.name,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked,
        },
        req,
    });

    res.json({ success: true });
});

const listAssignableAdmins = asyncHandler(async (req, res) => {
    const items = await User.find({
        role: { $in: ["ADMIN", "SUPER_ADMIN"] },
        isBlocked: false,
    })
        .sort("name")
        .select("name email role");

    res.json({ success: true, items });
});

export {
    me,
    listUsers,
    createUser,
    updateUser,
    deleteUser,
    listAssignableAdmins,
};

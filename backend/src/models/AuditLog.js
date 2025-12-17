import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: [true, "Please specify the action"],
            trim: true,
        },
        entity: {
            type: String,
            required: [true, "Please specify the entity"],
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "Please specify the entity ID"],
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Please specify who performed the action"],
        },
        oldValues: {
            type: mongoose.Schema.Types.Mixed,
        },
        newValues: {
            type: mongoose.Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
            required: [true, "IP address is required"],
        },
        userAgent: {
            type: String,
        },
        status: {
            type: String,
            enum: ["Success", "Failed"],
            default: "Success",
        },
        error: {
            message: String,
            stack: String,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for faster querying
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });

// Virtual for user who performed the action
auditLogSchema.virtual("performedByUser", {
    ref: "User",
    localField: "performedBy",
    foreignField: "_id",
    justOne: true,
});

// Static method to log an action
auditLogSchema.statics.log = async function ({
    action,
    entity,
    entityId,
    performedBy,
    oldValues = {},
    newValues = {},
    req,
    error = null,
}) {
    // Get correct IP address from headers (handles proxies)
    let ipAddress = "unknown";
    if (req) {
        // Check forwarded headers first (for proxies/load balancers)
        const forwardedFor = req.headers['x-forwarded-for'];
        if (forwardedFor) {
            // Get the first IP from the list (original client IP)
            ipAddress = forwardedFor.split(',')[0].trim();
        } else {
            // Check other headers
            ipAddress = req.headers['x-real-ip'] ||
                       req.headers['cf-connecting-ip'] || // Cloudflare
                       req.headers['true-client-ip'] || // Some proxies
                       req.connection?.remoteAddress ||
                       req.socket?.remoteAddress ||
                       req.ip ||
                       "unknown";
        }
        
        // Handle IPv6 localhost (::1) and IPv4 localhost (127.0.0.1)
        if (ipAddress === "::1" || ipAddress === "::ffff:127.0.0.1") {
            ipAddress = "127.0.0.1";
        }
        
        // Remove IPv6 prefix if present
        if (ipAddress.startsWith("::ffff:")) {
            ipAddress = ipAddress.replace("::ffff:", "");
        }
    }

    const auditLog = {
        action,
        entity,
        entityId,
        performedBy,
        ipAddress,
        userAgent: req?.get("user-agent"),
        status: error ? "Failed" : "Success",
    };

    // Only include values if they exist
    if (Object.keys(oldValues).length > 0) {
        auditLog.oldValues = oldValues;
    }

    if (Object.keys(newValues).length > 0) {
        auditLog.newValues = newValues;
    }

    if (error) {
        auditLog.error = {
            message: error.message,
            stack:
                process.env.NODE_ENV === "development"
                    ? error.stack
                    : undefined,
        };
    }

    return this.create(auditLog);
};

export default mongoose.model("AuditLog", auditLogSchema);

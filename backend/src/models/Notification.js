import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            index: true,
        },
        type: {
            type: String,
            required: [true, "Notification type is required"],
            enum: [
                "INCIDENT_CREATED",
                "INCIDENT_UPDATED",
                "INCIDENT_RESOLVED",
                "INCIDENT_IN_PROGRESS",
                "INCIDENT_REOPENED",
                "INCIDENT_CLOSED",
                "INCIDENT_DELETED",
                "INCIDENT_ASSIGNED",
                "BULK_RESOLVE",
            ],
        },
        title: {
            type: String,
            required: [true, "Title is required"],
        },
        message: {
            type: String,
            required: [true, "Message is required"],
        },
        incidentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for faster querying
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// Static method to create a notification
notificationSchema.statics.createNotification = async function ({
    user,
    type,
    title,
    message,
    incidentId = null,
}) {
    return this.create({
        user,
        type,
        title,
        message,
        incidentId,
    });
};

// Static method to create notifications for multiple users
notificationSchema.statics.createNotifications = async function (notifications) {
    return this.insertMany(notifications);
};

export default mongoose.model("Notification", notificationSchema);

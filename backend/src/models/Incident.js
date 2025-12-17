import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Please add a title"],
            trim: true,
            maxlength: [100, "Title cannot be more than 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Please add a description"],
        },
        category: {
            type: String,
            required: [true, "Please select a category"],
            enum: [
                "Security Breach",
                "Data Leak",
                "System Failure",
                "Unauthorized Access",
                "Malware",
                "Phishing",
                "Ransomware",
                "Other",
            ],
        },
        priority: {
            type: String,
            required: [true, "Please select a priority"],
            enum: ["Low", "Medium", "High"],
            default: "Medium",
        },
        incidentDate: {
            type: Date,
            required: [true, "Please provide the incident date"],
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["Open", "In Progress", "Resolved", "Closed"],
            default: "Open",
        },
        evidenceFiles: [
            {
                type: String,
                trim: true,
            },
        ],
        createdBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        assignedTo: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
        },
        resolvedAt: Date,
        resolutionNotes: String,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Add text index for search functionality
incidentSchema.index({
    title: "text",
    description: "text",
    category: "text",
    status: "text",
});

// Virtual for audit logs
incidentSchema.virtual("auditLogs", {
    ref: "AuditLog",
    localField: "_id",
    foreignField: "incidentId",
    justOne: false,
});

// Update status timestamp when status changes to Resolved
incidentSchema.pre("save", function (next) {
    if (
        this.isModified("status") &&
        this.status === "Resolved" &&
        !this.resolvedAt
    ) {
        this.resolvedAt = Date.now();
    }
    next();
});

export default mongoose.model("Incident", incidentSchema);

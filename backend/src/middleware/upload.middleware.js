import path from "path";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";

const allowedExt = new Set([".jpg", ".jpeg", ".png", ".pdf"]);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(process.cwd(), "src", "public", "uploads");
        try {
            fs.mkdirSync(uploadsDir, { recursive: true });
        } catch (e) {
            cb(e);
            return;
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = crypto.randomBytes(16).toString("hex");
        cb(null, `${Date.now()}_${name}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.has(ext)) {
        cb(new Error("Invalid file type. Allowed: jpg, png, pdf"), false);
        return;
    }
    cb(null, true);
};

const uploadEvidence = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

export { uploadEvidence };

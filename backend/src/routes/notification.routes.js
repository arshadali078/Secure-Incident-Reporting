import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/:notificationId/read", markAsRead);
router.patch("/read-all", markAllAsRead);
router.delete("/:notificationId", deleteNotification);
router.delete("/", deleteAllNotifications);

export default router;

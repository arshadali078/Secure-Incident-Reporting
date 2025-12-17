import express from "express";
import { listLogs } from "../controllers/log.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("SUPER_ADMIN"), listLogs);

export default router;

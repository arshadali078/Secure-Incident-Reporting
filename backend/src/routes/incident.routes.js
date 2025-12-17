import express from "express";
import {
    bulkResolve,
    createIncident,
    exportCsv,
    exportPdf,
    getIncident,
    hardDeleteIncident,
    listIncidents,
    stats,
    updateIncident,
} from "../controllers/incident.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { uploadEvidence } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/stats", authorize("ADMIN", "SUPER_ADMIN"), stats);
router.get("/export/csv", authorize("ADMIN", "SUPER_ADMIN"), exportCsv);
router.get("/export/pdf", authorize("ADMIN", "SUPER_ADMIN"), exportPdf);
router.patch("/bulk/resolve", authorize("ADMIN", "SUPER_ADMIN"), bulkResolve);

router
    .route("/")
    .get(listIncidents)
    .post(uploadEvidence.array("evidence", 5), createIncident);

router
    .route("/:id")
    .get(getIncident)
    .patch(updateIncident)
    .delete(authorize("SUPER_ADMIN"), hardDeleteIncident);

export default router;

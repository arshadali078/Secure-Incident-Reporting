import express from "express";
import {
    createUser,
    deleteUser,
    listAssignableAdmins,
    listUsers,
    me,
    updateUser,
} from "../controllers/user.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/me", me);

router.get("/admins", authorize("ADMIN", "SUPER_ADMIN"), listAssignableAdmins);

router
    .route("/")
    .get(authorize("SUPER_ADMIN"), listUsers)
    .post(authorize("SUPER_ADMIN"), createUser);

router
    .route("/:id")
    .patch(authorize("SUPER_ADMIN"), updateUser)
    .delete(authorize("SUPER_ADMIN"), deleteUser);

export default router;

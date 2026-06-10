import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.js";
import * as ctrl from "./profile.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/profile", ctrl.getProfile);
router.patch("/profile", ctrl.updateProfile);
router.post("/profile/change-password", ctrl.changePassword);
router.delete("/profile", ctrl.deleteAccount);

export default router;

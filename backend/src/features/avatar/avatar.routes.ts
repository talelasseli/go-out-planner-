import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.js";
import * as ctrl from "./avatar.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/avatar/upload-url", ctrl.getUploadUrl);
router.post("/avatar/complete", ctrl.completeUpload);

export default router;

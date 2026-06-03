import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.js";
import * as ctrl from "./invitations.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/invitations", ctrl.list);
router.patch("/invitations/:invitationId/accept", ctrl.accept);
router.patch("/invitations/:invitationId/decline", ctrl.decline);

export default router;

import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.js";
import * as ctrl from "./plans.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/plans", ctrl.create);
router.get("/plans/created", ctrl.listCreated);
router.get("/plans/invited", ctrl.listInvited);
router.get("/plans/:planId", ctrl.getById);
router.patch("/plans/:planId/cancel", ctrl.cancel);
router.delete("/plans/:planId", ctrl.remove);

export default router;

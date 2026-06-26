import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.js";
import * as ctrl from "./notifications.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/notifications/stream", ctrl.streamNotifications);
router.get("/notifications/unread-count", ctrl.getUnreadCount);
router.patch("/notifications/read-all", ctrl.markAllRead);
router.patch("/notifications/:id/read", ctrl.markRead);
router.get("/notifications", ctrl.list);

export default router;

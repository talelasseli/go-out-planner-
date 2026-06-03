import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.js";
import * as ctrl from "./friends.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/users/search", ctrl.search);
router.post("/friend-requests", ctrl.send);
router.get("/friend-requests/received", ctrl.listReceived);
router.patch("/friend-requests/:id/accept", ctrl.accept);
router.patch("/friend-requests/:id/reject", ctrl.reject);
router.get("/friends", ctrl.list);

export default router;

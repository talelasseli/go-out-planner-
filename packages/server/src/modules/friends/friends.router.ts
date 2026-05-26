import { Router } from "express";
import { prisma } from "../../prisma.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validate } from "../../middleware/validate.js";
import { sendFriendRequestSchema } from "./friends.schema.js";
import * as friendsService from "./friends.service.js";
import * as usersService from "../users/users.service.js";

const router = Router();

router.post("/friend-requests", requireAuth, validate(sendFriendRequestSchema), async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const receiverProfile = await prisma.profile.findUnique({
      where: { id: req.body.receiverId },
    });
    if (!receiverProfile) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const result = await friendsService.sendFriendRequest(prisma, profile.id, receiverProfile.id);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/friend-requests/received", requireAuth, async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const requests = await friendsService.getReceivedRequests(prisma, profile.id);
    res.json(requests);
  } catch (e) {
    next(e);
  }
});

router.patch("/friend-requests/:requestId/accept", requireAuth, async (req, res, next) => {
  try {
    const { requestId } = req.params as { requestId: string };
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const result = await friendsService.acceptFriendRequest(prisma, requestId, profile.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.patch("/friend-requests/:requestId/reject", requireAuth, async (req, res, next) => {
  try {
    const { requestId } = req.params as { requestId: string };
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const result = await friendsService.rejectFriendRequest(prisma, requestId, profile.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/friends", requireAuth, async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const friends = await friendsService.getFriends(prisma, profile.id);
    res.json(friends);
  } catch (e) {
    next(e);
  }
});

export default router;

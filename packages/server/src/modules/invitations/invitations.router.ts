import { Router } from "express";
import { prisma } from "../../prisma.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as invitationsService from "./invitations.service.js";
import * as usersService from "../users/users.service.js";

const router = Router();

router.get("/invitations", requireAuth, async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const invitations = await invitationsService.getInvitations(prisma, profile.id);
    res.json(invitations);
  } catch (e) {
    next(e);
  }
});

router.patch("/invitations/:invitationId/accept", requireAuth, async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const result = await invitationsService.acceptInvitation(prisma, req.params.invitationId, profile.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.patch("/invitations/:invitationId/decline", requireAuth, async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const result = await invitationsService.declineInvitation(prisma, req.params.invitationId, profile.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;

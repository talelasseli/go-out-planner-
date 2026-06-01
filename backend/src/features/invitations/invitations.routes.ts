import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { requireAuth } from "../../shared/middleware/auth.js";
import { success, message } from "../../shared/response.js";
import { AppError } from "../../shared/errors.js";

const router = Router();

router.use(requireAuth);

router.get("/invitations", async (req, res, next) => {
  try {
    const currentUserId = req.user!.id;

    const invitations = await prisma.planInvitation.findMany({
      where: { invitedUserId: currentUserId },
      select: {
        id: true,
        status: true,
        plan: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            place: true,
            status: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    success(res, { invitations });
  } catch (error) {
    next(error);
  }
});

router.patch("/invitations/:invitationId/accept", async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const currentUserId = req.user!.id;

    const invitation = await prisma.planInvitation.findUnique({
      where: { id: invitationId },
      select: {
        invitedUserId: true,
        status: true,
        plan: { select: { status: true } },
      },
    });

    if (!invitation) {
      throw new AppError(404, "Invitation not found");
    }

    if (invitation.invitedUserId !== currentUserId) {
      throw new AppError(403, "Not authorized to respond to this invitation");
    }

    if (invitation.status !== "PENDING") {
      throw new AppError(400, "Invitation is not pending");
    }

    if (invitation.plan.status !== "ACTIVE") {
      throw new AppError(400, "Cannot accept invitation for a cancelled plan");
    }

    await prisma.planInvitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });

    message(res, "Invitation accepted");
  } catch (error) {
    next(error);
  }
});

router.patch("/invitations/:invitationId/decline", async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const currentUserId = req.user!.id;

    const invitation = await prisma.planInvitation.findUnique({
      where: { id: invitationId },
      select: {
        invitedUserId: true,
        status: true,
        plan: { select: { status: true } },
      },
    });

    if (!invitation) {
      throw new AppError(404, "Invitation not found");
    }

    if (invitation.invitedUserId !== currentUserId) {
      throw new AppError(403, "Not authorized to respond to this invitation");
    }

    if (invitation.status !== "PENDING") {
      throw new AppError(400, "Invitation is not pending");
    }

    if (invitation.plan.status !== "ACTIVE") {
      throw new AppError(400, "Cannot decline invitation for a cancelled plan");
    }

    await prisma.planInvitation.update({
      where: { id: invitationId },
      data: { status: "DECLINED", respondedAt: new Date() },
    });

    message(res, "Invitation declined");
  } catch (error) {
    next(error);
  }
});

export default router;

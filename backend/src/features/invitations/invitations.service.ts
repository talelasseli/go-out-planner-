import { prisma } from "../../shared/prisma.js";
import { AppError } from "../../shared/errors.js";
import { createNotification, publishNotification } from "../notifications/notifications.service.js";

async function findOwnPendingInvitation(invitationId: string, userId: string) {
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

  if (invitation.invitedUserId !== userId) {
    throw new AppError(403, "Not authorized to respond to this invitation");
  }

  if (invitation.status !== "PENDING") {
    throw new AppError(400, "Invitation is not pending");
  }

  if (invitation.plan.status !== "ACTIVE") {
    throw new AppError(400, "Cannot respond to an invitation for a cancelled plan");
  }
}

export async function listInvitations(userId: string) {
  return prisma.planInvitation.findMany({
    where: { invitedUserId: userId },
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
}

export async function acceptInvitation(invitationId: string, userId: string, userName: string) {
  const invitation = await invitationWithPlan(invitationId);
  await findOwnPendingInvitation(invitationId, userId);

  const { notification } = await prisma.$transaction(async (tx) => {
    await tx.planInvitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    const notification = await createNotification(tx, {
      userId: invitation!.plan.creatorId,
      type: "INVITATION_RESPONSE",
      title: "Invitation accepted",
      message: `${userName} accepted your invitation to "${invitation!.plan.title}"`,
      link: `/plans/${invitation!.planId}`,
    });
    return { notification };
  });
  publishNotification(notification);
}

export async function declineInvitation(invitationId: string, userId: string, userName: string) {
  const invitation = await invitationWithPlan(invitationId);
  await findOwnPendingInvitation(invitationId, userId);

  const { notification } = await prisma.$transaction(async (tx) => {
    await tx.planInvitation.update({
      where: { id: invitationId },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
    const notification = await createNotification(tx, {
      userId: invitation!.plan.creatorId,
      type: "INVITATION_RESPONSE",
      title: "Invitation declined",
      message: `${userName} declined your invitation to "${invitation!.plan.title}"`,
      link: `/plans/${invitation!.planId}`,
    });
    return { notification };
  });
  publishNotification(notification);
}

async function invitationWithPlan(invitationId: string) {
  return prisma.planInvitation.findUnique({
    where: { id: invitationId },
    select: {
      planId: true,
      plan: { select: { creatorId: true, title: true } },
    },
  });
}

import { prisma } from "../../shared/prisma.js";
import { AppError } from "../../shared/errors.js";

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

export async function acceptInvitation(invitationId: string, userId: string) {
  await findOwnPendingInvitation(invitationId, userId);

  await prisma.planInvitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });
}

export async function declineInvitation(invitationId: string, userId: string) {
  await findOwnPendingInvitation(invitationId, userId);

  await prisma.planInvitation.update({
    where: { id: invitationId },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
}

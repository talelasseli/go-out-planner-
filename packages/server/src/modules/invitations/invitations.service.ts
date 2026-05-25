import type { PrismaClient } from "@prisma/client";
import { AppError } from "../../lib/AppError.js";

export async function getInvitations(
  prisma: PrismaClient,
  profileId: string,
) {
  return prisma.planInvitation.findMany({
    where: {
      invitedUserId: profileId,
      plan: { deletedAt: null, status: { not: "CANCELLED" } },
    },
    include: {
      plan: {
        include: {
          creator: { select: { id: true, username: true, displayName: true } },
          activities: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptInvitation(
  prisma: PrismaClient,
  invitationId: string,
  profileId: string,
) {
  const invitation = await prisma.planInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw new AppError(404, "Invitation not found");
  if (invitation.invitedUserId !== profileId) {
    throw new AppError(403, "Not your invitation");
  }
  if (invitation.status !== "PENDING") {
    throw new AppError(400, "Invitation already responded to");
  }

  return prisma.planInvitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });
}

export async function declineInvitation(
  prisma: PrismaClient,
  invitationId: string,
  profileId: string,
) {
  const invitation = await prisma.planInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw new AppError(404, "Invitation not found");
  if (invitation.invitedUserId !== profileId) {
    throw new AppError(403, "Not your invitation");
  }
  if (invitation.status !== "PENDING") {
    throw new AppError(400, "Invitation already responded to");
  }

  return prisma.planInvitation.update({
    where: { id: invitationId },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
}

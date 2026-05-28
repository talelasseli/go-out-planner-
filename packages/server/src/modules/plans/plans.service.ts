import type { PrismaClient, Prisma } from "@prisma/client";
import { AppError } from "../../lib/AppError.js";

export async function createPlan(
  prisma: PrismaClient,
  profileId: string,
  data: {
    title: string;
    planDate: string;
    planTime: string;
    place: string;
    latitude?: number;
    longitude?: number;
    meetupPlace?: string;
    activities: string[];
    invitedFriendIds: string[];
  },
) {
  return prisma.$transaction(async (tx) => {
    const friendIds = await getFriendIds(tx, profileId);
    const invalidInvites = data.invitedFriendIds.filter(
      (id) => !friendIds.includes(id),
    );
    if (invalidInvites.length > 0) {
      throw new AppError(400, "Can only invite friends");
    }

    const plan = await tx.plan.create({
      data: {
        creatorId: profileId,
        title: data.title,
        planDate: new Date(data.planDate),
        planTime: data.planTime,
        place: data.place,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        meetupPlace: data.meetupPlace ?? null,
        activities: {
          create: data.activities.map((name) => ({ activityName: name })),
        },
        invitations: {
          create: data.invitedFriendIds.map((id) => ({
            invitedUserId: id,
          })),
        },
      },
      include: { activities: true, invitations: true },
    });

    return plan;
  });
}

export async function getCreatedPlans(prisma: PrismaClient, profileId: string) {
  return prisma.plan.findMany({
    where: { creatorId: profileId, deletedAt: null },
    include: {
      activities: true,
      invitations: {
        include: {
          invitee: { select: { id: true, username: true, displayName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvitedPlans(prisma: PrismaClient, profileId: string) {
  return prisma.plan.findMany({
    where: {
      invitations: { some: { invitedUserId: profileId } },
      deletedAt: null,
    },
    include: {
      creator: { select: { id: true, username: true, displayName: true } },
      activities: true,
      invitations: {
        where: { invitedUserId: profileId },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlanById(
  prisma: PrismaClient,
  planId: string,
  profileId: string,
) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      creator: { select: { id: true, username: true, displayName: true } },
      activities: true,
      invitations: {
        include: {
          invitee: { select: { id: true, username: true, displayName: true, userId: true } },
        },
      },
    },
  });

  if (!plan || plan.deletedAt) {
    throw new AppError(404, "Plan not found");
  }

  const isCreator = plan.creatorId === profileId;
  const isInvited = plan.invitations.some(
    (inv) => inv.invitedUserId === profileId,
  );

  if (!isCreator && !isInvited) {
    throw new AppError(403, "Not authorized to view this plan");
  }

  return plan;
}

export async function editPlan(
  prisma: PrismaClient,
  profileId: string,
  planId: string,
  data: {
    title?: string;
    planDate?: string;
    planTime?: string;
    place?: string;
    latitude?: number;
    longitude?: number;
    meetupPlace?: string;
    activities?: string[];
    invitedFriendIds?: string[];
  },
) {
  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.findUnique({ where: { id: planId } });

    if (!plan || plan.deletedAt) throw new AppError(404, "Plan not found");
    if (plan.creatorId !== profileId) throw new AppError(403, "Only the creator can edit this plan");
    if (plan.status === "CANCELLED") throw new AppError(400, "Cannot edit a cancelled plan");

    const updateData: Prisma.PlanUpdateInput = {};
    if (data.title) updateData.title = data.title;
    if (data.planDate) updateData.planDate = new Date(data.planDate);
    if (data.planTime) updateData.planTime = data.planTime;
    if (data.place) updateData.place = data.place;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.meetupPlace !== undefined) updateData.meetupPlace = data.meetupPlace;

    if (data.activities) {
      await tx.planActivity.deleteMany({ where: { planId } });
      updateData.activities = {
        create: data.activities.map((name) => ({ activityName: name })),
      };
    }

    if (data.invitedFriendIds) {
      const friendIds = await getFriendIds(tx, profileId);
      const invalidInvites = data.invitedFriendIds.filter((id) => !friendIds.includes(id));
      if (invalidInvites.length > 0) {
        throw new AppError(400, "Can only invite friends");
      }

      await tx.planInvitation.deleteMany({ where: { planId } });
      updateData.invitations = {
        create: data.invitedFriendIds.map((id) => ({
          invitedUserId: id,
        })),
      };
    }

    return tx.plan.update({
      where: { id: planId },
      data: updateData,
      include: { activities: true, invitations: true },
    });
  });
}

export async function cancelPlan(
  prisma: PrismaClient,
  profileId: string,
  planId: string,
) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });

  if (!plan || plan.deletedAt) throw new AppError(404, "Plan not found");
  if (plan.creatorId !== profileId) throw new AppError(403, "Only the creator can cancel this plan");
  if (plan.status === "CANCELLED") throw new AppError(400, "Plan is already cancelled");

  return prisma.plan.update({
    where: { id: planId },
    data: { status: "CANCELLED" },
  });
}

export async function deletePlan(
  prisma: PrismaClient,
  profileId: string,
  planId: string,
) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });

  if (!plan || plan.deletedAt) throw new AppError(404, "Plan not found");
  if (plan.creatorId !== profileId) throw new AppError(403, "Only the creator can delete this plan");

  return prisma.plan.update({
    where: { id: planId },
    data: { deletedAt: new Date() },
  });
}

async function getFriendIds(tx: PrismaClient | Prisma.TransactionClient, profileId: string) {
  const friendships = await tx.friendship.findMany({
    where: { userId: profileId },
    select: { friendId: true },
  });
  return friendships.map((f) => f.friendId);
}

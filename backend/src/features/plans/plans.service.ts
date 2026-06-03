import { prisma } from "../../shared/prisma.js";
import { AppError } from "../../shared/errors.js";
import type { CreatePlanDto } from "./plans.validation.js";

export async function createPlan(data: CreatePlanDto, userId: string) {
  if (data.invitedUserIds.includes(userId)) {
    throw new AppError(400, "Cannot invite yourself");
  }

  const users = await prisma.user.findMany({
    where: { id: { in: data.invitedUserIds } },
    select: { id: true },
  });
  if (users.length !== data.invitedUserIds.length) {
    throw new AppError(400, "One or more invited users do not exist");
  }

  const friendships = await prisma.friendship.findMany({
    where: { userId, friendId: { in: data.invitedUserIds } },
    select: { friendId: true },
  });
  const friendIds = new Set(friendships.map((f) => f.friendId));
  const notFriends = data.invitedUserIds.filter((id) => !friendIds.has(id));
  if (notFriends.length > 0) {
    throw new AppError(400, "All invited users must be friends with you");
  }

  const plan = await prisma.$transaction(async (tx) => {
    const newPlan = await tx.plan.create({
      data: {
        creatorId: userId,
        title: data.title,
        scheduledAt: new Date(data.scheduledAt),
        place: data.place,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        status: "ACTIVE",
      },
    });

    await tx.planActivity.createMany({
      data: data.activities.map((a) => ({
        planId: newPlan.id,
        activityName: a,
      })),
    });

    const createdInvites = await Promise.all(
      data.invitedUserIds.map((invitedUserId) =>
        tx.planInvitation.create({
          data: {
            planId: newPlan.id,
            invitedUserId,
            status: "PENDING",
          },
          select: { id: true, invitedUserId: true, status: true },
        }),
      ),
    );

    return { ...newPlan, invitations: createdInvites };
  });

  return plan;
}

export async function getCreatedPlans(userId: string) {
  return prisma.plan.findMany({
    where: { creatorId: userId },
    select: {
      id: true,
      title: true,
      scheduledAt: true,
      place: true,
      latitude: true,
      longitude: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvitedPlans(userId: string) {
  const invitations = await prisma.planInvitation.findMany({
    where: { invitedUserId: userId },
    select: {
      status: true,
      plan: {
        select: {
          id: true,
          title: true,
          scheduledAt: true,
          place: true,
          latitude: true,
          longitude: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations.map((inv) => ({
    ...inv.plan,
    invitationStatus: inv.status,
  }));
}

export async function getPlanById(planId: string, userId: string) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      title: true,
      scheduledAt: true,
      place: true,
      latitude: true,
      longitude: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      creatorId: true,
      creator: {
        select: { id: true, name: true, username: true },
      },
      activities: {
        select: { activityName: true },
        orderBy: { createdAt: "asc" },
      },
      invitations: {
        select: {
          id: true,
          status: true,
          invitedUser: {
            select: { id: true, name: true, username: true },
          },
        },
      },
    },
  });

  if (!plan) {
    throw new AppError(404, "Plan not found");
  }

  const isCreator = plan.creatorId === userId;
  const isInvited = plan.invitations.some((inv) => inv.invitedUser.id === userId);

  if (!isCreator && !isInvited) {
    throw new AppError(403, "Not authorized to view this plan");
  }

  return {
    id: plan.id,
    title: plan.title,
    scheduledAt: plan.scheduledAt,
    place: plan.place,
    latitude: plan.latitude,
    longitude: plan.longitude,
    status: plan.status,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    creator: plan.creator,
    activities: plan.activities.map((a) => a.activityName),
    invitations: plan.invitations,
  };
}

export async function cancelPlan(planId: string, userId: string) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { creatorId: true, status: true },
  });

  if (!plan) {
    throw new AppError(404, "Plan not found");
  }

  if (plan.creatorId !== userId) {
    throw new AppError(403, "Only the creator can cancel this plan");
  }

  if (plan.status !== "ACTIVE") {
    throw new AppError(400, "Plan is already cancelled");
  }

  await prisma.plan.update({
    where: { id: planId },
    data: { status: "CANCELLED" },
  });
}

export async function deletePlan(planId: string, userId: string) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { creatorId: true },
  });

  if (!plan) {
    throw new AppError(404, "Plan not found");
  }

  if (plan.creatorId !== userId) {
    throw new AppError(403, "Only the creator can delete this plan");
  }

  await prisma.plan.delete({ where: { id: planId } });
}

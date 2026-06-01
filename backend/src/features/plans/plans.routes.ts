import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { requireAuth } from "../../shared/middleware/auth.js";
import { success, message, created } from "../../shared/response.js";
import { AppError } from "../../shared/errors.js";

const router = Router();

router.use(requireAuth);

const MAX_ACTIVITIES = 10;
const MAX_ACTIVITY_NAME = 100;
const MAX_INVITEES = 20;

router.post("/plans", async (req, res, next) => {
  try {
    const { title, scheduledAt, place, activities, invitedUserIds } = req.body;
    const currentUserId = req.user!.id;

    if (!title || typeof title !== "string" || title.trim().length < 3 || title.trim().length > 150) {
      throw new AppError(400, "Title must be between 3 and 150 characters");
    }

    if (!scheduledAt || isNaN(Date.parse(scheduledAt))) {
      throw new AppError(400, "Valid scheduledAt is required");
    }
    if (new Date(scheduledAt) <= new Date()) {
      throw new AppError(400, "Scheduled date must be in the future");
    }

    if (!place || typeof place !== "string" || place.trim().length < 2 || place.trim().length > 255) {
      throw new AppError(400, "Place must be between 2 and 255 characters");
    }

    if (!Array.isArray(activities) || activities.length < 1 || activities.length > MAX_ACTIVITIES) {
      throw new AppError(400, `Activities must be between 1 and ${MAX_ACTIVITIES} items`);
    }
    for (const a of activities) {
      if (typeof a !== "string" || a.trim().length < 1 || a.trim().length > MAX_ACTIVITY_NAME) {
        throw new AppError(400, `Each activity must be between 1 and ${MAX_ACTIVITY_NAME} characters`);
      }
    }

    if (!Array.isArray(invitedUserIds) || invitedUserIds.length < 1 || invitedUserIds.length > MAX_INVITEES) {
      throw new AppError(400, `Must invite between 1 and ${MAX_INVITEES} users`);
    }

    const uniqueIds = [...new Set(invitedUserIds)];

    if (uniqueIds.includes(currentUserId)) {
      throw new AppError(400, "Cannot invite yourself");
    }

    const users = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (users.length !== uniqueIds.length) {
      throw new AppError(400, "One or more invited users do not exist");
    }

    const friendships = await prisma.friendship.findMany({
      where: { userId: currentUserId, friendId: { in: uniqueIds } },
      select: { friendId: true },
    });
    const friendIds = new Set(friendships.map((f) => f.friendId));
    const notFriends = uniqueIds.filter((id) => !friendIds.has(id));
    if (notFriends.length > 0) {
      throw new AppError(400, "All invited users must be friends with you");
    }

    const plan = await prisma.$transaction(async (tx) => {
      const newPlan = await tx.plan.create({
        data: {
          creatorId: currentUserId,
          title: title.trim(),
          scheduledAt: new Date(scheduledAt),
          place: place.trim(),
          status: "ACTIVE",
        },
      });

      await tx.planActivity.createMany({
        data: activities.map((a: string) => ({
          planId: newPlan.id,
          activityName: a.trim(),
        })),
      });

      const createdInvites = await Promise.all(
        uniqueIds.map((userId) =>
          tx.planInvitation.create({
            data: {
              planId: newPlan.id,
              invitedUserId: userId,
              status: "PENDING",
            },
            select: { id: true, invitedUserId: true, status: true },
          }),
        ),
      );

      return { ...newPlan, invitations: createdInvites };
    });

    created(res, { plan });
  } catch (error) {
    next(error);
  }
});

router.get("/plans/created", async (req, res, next) => {
  try {
    const currentUserId = req.user!.id;

    const plans = await prisma.plan.findMany({
      where: { creatorId: currentUserId },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        place: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    success(res, { plans });
  } catch (error) {
    next(error);
  }
});

router.get("/plans/invited", async (req, res, next) => {
  try {
    const currentUserId = req.user!.id;

    const invitations = await prisma.planInvitation.findMany({
      where: { invitedUserId: currentUserId },
      select: {
        status: true,
        plan: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            place: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const plans = invitations.map((inv) => ({
      ...inv.plan,
      invitationStatus: inv.status,
    }));

    success(res, { plans });
  } catch (error) {
    next(error);
  }
});

router.get("/plans/:planId", async (req, res, next) => {
  try {
    const { planId } = req.params;
    const currentUserId = req.user!.id;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        place: true,
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

    const isCreator = plan.creatorId === currentUserId;
    const isInvited = plan.invitations.some((inv) => inv.invitedUser.id === currentUserId);

    if (!isCreator && !isInvited) {
      throw new AppError(403, "Not authorized to view this plan");
    }

    const result = {
      id: plan.id,
      title: plan.title,
      scheduledAt: plan.scheduledAt,
      place: plan.place,
      status: plan.status,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      creator: plan.creator,
      activities: plan.activities.map((a) => a.activityName),
      invitations: plan.invitations,
    };

    success(res, { plan: result });
  } catch (error) {
    next(error);
  }
});

router.patch("/plans/:planId/cancel", async (req, res, next) => {
  try {
    const { planId } = req.params;
    const currentUserId = req.user!.id;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: { creatorId: true, status: true },
    });

    if (!plan) {
      throw new AppError(404, "Plan not found");
    }

    if (plan.creatorId !== currentUserId) {
      throw new AppError(403, "Only the creator can cancel this plan");
    }

    if (plan.status !== "ACTIVE") {
      throw new AppError(400, "Plan is already cancelled");
    }

    await prisma.plan.update({
      where: { id: planId },
      data: { status: "CANCELLED" },
    });

    message(res, "Plan cancelled");
  } catch (error) {
    next(error);
  }
});

router.delete("/plans/:planId", async (req, res, next) => {
  try {
    const { planId } = req.params;
    const currentUserId = req.user!.id;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: { creatorId: true },
    });

    if (!plan) {
      throw new AppError(404, "Plan not found");
    }

    if (plan.creatorId !== currentUserId) {
      throw new AppError(403, "Only the creator can delete this plan");
    }

    await prisma.plan.delete({ where: { id: planId } });

    message(res, "Plan deleted");
  } catch (error) {
    next(error);
  }
});

export default router;

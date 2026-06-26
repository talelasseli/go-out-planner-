import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";
import { AppError } from "../../shared/errors.js";
import { sendToUser } from "../../lib/sse.js";

export async function createNotification(
  db: Prisma.TransactionClient | PrismaClient,
  input: {
    userId: string;
    type: "FRIEND_REQUEST" | "INVITATION" | "INVITATION_RESPONSE";
    title: string;
    message: string;
    link?: string;
  },
) {
  return db.notification.create({ data: input });
}

export function publishNotification(
  notification: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    read: boolean;
    createdAt: Date;
  },
) {
  sendToUser(notification.userId, {
    event: "notification",
    id: notification.id,
    data: { notification },
  });
}

export async function listNotifications(userId: string, cursor?: string, limit = 20) {
  const where: Prisma.NotificationWhereInput = { userId };
  if (cursor) {
    const cursorNotification = await prisma.notification.findUnique({
      where: { id: cursor },
      select: { createdAt: true, id: true },
    });
    if (cursorNotification) {
      where.OR = [
        { createdAt: { lt: cursorNotification.createdAt } },
        { createdAt: cursorNotification.createdAt, id: { lt: cursorNotification.id } },
      ];
    }
  }

  const items = await prisma.notification.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    unreadCount,
  };
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  });
  if (!notification) throw new AppError(404, "Notification not found");
  if (notification.userId !== userId) throw new AppError(403, "Not authorized");
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

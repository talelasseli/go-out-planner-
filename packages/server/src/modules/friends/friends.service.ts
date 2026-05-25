import type { PrismaClient } from "@prisma/client";
import { AppError } from "../../lib/AppError.js";

export async function sendFriendRequest(
  prisma: PrismaClient,
  senderId: string,
  receiverId: string,
) {
  if (senderId === receiverId) {
    throw new AppError(400, "Cannot send friend request to yourself");
  }

  const existing = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId, receiverId } },
  });

  if (existing && existing.status === "PENDING") {
    throw new AppError(409, "Friend request already sent");
  }

  const reverse = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
  });

  if (reverse && reverse.status === "ACCEPTED") {
    throw new AppError(409, "Already friends");
  }

  if (reverse && reverse.status === "PENDING") {
    await prisma.friendRequest.update({
      where: { id: reverse.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    await createFriendship(prisma, senderId, receiverId);
    return { message: "Friend request accepted (mutual)" };
  }

  return prisma.friendRequest.create({
    data: {
      senderId,
      receiverId,
    },
  });
}

export function getReceivedRequests(prisma: PrismaClient, profileId: string) {
  return prisma.friendRequest.findMany({
    where: { receiverId: profileId, status: "PENDING" },
    include: {
      sender: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptFriendRequest(
  prisma: PrismaClient,
  requestId: string,
  profileId: string,
) {
  const req = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!req || req.receiverId !== profileId) {
    throw new AppError(404, "Friend request not found");
  }

  if (req.status !== "PENDING") {
    throw new AppError(400, "Friend request already responded to");
  }

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });

  await createFriendship(prisma, req.senderId, req.receiverId);

  return { message: "Friend request accepted" };
}

export async function rejectFriendRequest(
  prisma: PrismaClient,
  requestId: string,
  profileId: string,
) {
  const req = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!req || req.receiverId !== profileId) {
    throw new AppError(404, "Friend request not found");
  }

  return prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", respondedAt: new Date() },
  });
}

export async function createFriendship(
  prisma: PrismaClient,
  userId: string,
  friendId: string,
) {
  await prisma.friendship.createMany({
    data: [
      { userId, friendId },
      { userId: friendId, friendId: userId },
    ],
    skipDuplicates: true,
  });
}

export function getFriends(prisma: PrismaClient, profileId: string) {
  return prisma.friendship.findMany({
    where: { userId: profileId },
    include: {
      friend: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

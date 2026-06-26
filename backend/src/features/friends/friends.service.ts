import { prisma } from "../../shared/prisma.js";
import { AppError } from "../../shared/errors.js";
import { createNotification, publishNotification } from "../notifications/notifications.service.js";
import type { UserWithRelationship, SendRequestResult } from "./friends.types.js";

export async function searchUsers(query: string, userId: string): Promise<UserWithRelationship[]> {
  const users = await prisma.user.findMany({
    where: {
      NOT: { id: userId },
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
    },
    take: 20,
  });

  if (users.length === 0) {
    return [];
  }

  const userIds = users.map((u) => u.id);

  const friendships = await prisma.friendship.findMany({
    where: { userId, friendId: { in: userIds } },
    select: { friendId: true },
  });
  const friendIds = new Set(friendships.map((f) => f.friendId));

  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: { in: userIds } },
        { receiverId: userId, senderId: { in: userIds } },
      ],
      status: "PENDING",
    },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
    },
  });

  const sentRequests = new Map<string, string>();
  const receivedRequests = new Map<string, string>();
  for (const fr of friendRequests) {
    if (fr.senderId === userId) {
      sentRequests.set(fr.receiverId, fr.id);
    } else {
      receivedRequests.set(fr.senderId, fr.id);
    }
  }

  return users.map((user) => {
    let relationship: UserWithRelationship["relationship"];
    let pendingRequestId: string | null = null;

    if (friendIds.has(user.id)) {
      relationship = "FRIENDS";
    } else if (sentRequests.has(user.id)) {
      relationship = "REQUEST_SENT";
    } else if (receivedRequests.has(user.id)) {
      relationship = "REQUEST_RECEIVED";
      pendingRequestId = receivedRequests.get(user.id)!;
    } else {
      relationship = "NONE";
    }

    return { ...user, relationship, pendingRequestId };
  });
}

export async function sendFriendRequest(
  receiverId: string,
  senderId: string,
  senderName: string,
): Promise<SendRequestResult> {
  if (receiverId === senderId) {
    throw new AppError(400, "Cannot send friend request to yourself");
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });
  if (!receiver) {
    throw new AppError(404, "User not found");
  }

  const existingFriendship = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: senderId, friendId: receiverId } },
  });
  if (existingFriendship) {
    throw new AppError(409, "Already friends");
  }

  const existingSent = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId, receiverId } },
  });

  if (existingSent && existingSent.status === "PENDING") {
    return { kind: "already_sent" };
  }

  if (existingSent && existingSent.status === "REJECTED") {
    const { request, notification } = await prisma.$transaction(async (tx) => {
      const request = await tx.friendRequest.update({
        where: { id: existingSent.id },
        data: { status: "PENDING", respondedAt: null },
      });
      const notification = await createNotification(tx, {
        userId: receiverId,
        type: "FRIEND_REQUEST",
        title: "New friend request",
        message: `${senderName} sent you a friend request`,
        link: "/friend-requests",
      });
      return { request, notification };
    });
    publishNotification(notification);
    return { kind: "resent", request: { id: request.id, senderId, receiverId, status: request.status } };
  }

  const existingReverse = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
  });

  if (existingReverse && existingReverse.status === "PENDING") {
    const { notification } = await prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: existingReverse.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      await tx.friendship.createMany({
        data: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId },
        ],
        skipDuplicates: true,
      });
      const notification = await createNotification(tx, {
        userId: receiverId,
        type: "FRIEND_REQUEST",
        title: "Friend request accepted",
        message: `${senderName} accepted your friend request`,
        link: "/friends",
      });
      return { notification };
    });
    publishNotification(notification);
    return { kind: "auto_accepted" };
  }

  const { request, notification } = await prisma.$transaction(async (tx) => {
    const request = await tx.friendRequest.create({
      data: { senderId, receiverId, status: "PENDING" },
    });
    const notification = await createNotification(tx, {
      userId: receiverId,
      type: "FRIEND_REQUEST",
      title: "New friend request",
      message: `${senderName} sent you a friend request`,
      link: "/friend-requests",
    });
    return { request, notification };
  });
  publishNotification(notification);

  return { kind: "created", request: { id: request.id, senderId, receiverId, status: request.status } };
}

export async function getReceivedRequests(userId: string) {
  return prisma.friendRequest.findMany({
    where: { receiverId: userId, status: "PENDING" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      sender: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptFriendRequest(requestId: string, userId: string, userName: string) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError(404, "Friend request not found");
  }

  if (request.receiverId !== userId) {
    throw new AppError(403, "Not authorized to accept this request");
  }

  if (request.status !== "PENDING") {
    throw new AppError(400, "Friend request is not pending");
  }

  const { notification } = await prisma.$transaction(async (tx) => {
    await tx.friendRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    await tx.friendship.createMany({
      data: [
        { userId: request.senderId, friendId: request.receiverId },
        { userId: request.receiverId, friendId: request.senderId },
      ],
      skipDuplicates: true,
    });
    const notification = await createNotification(tx, {
      userId: request.senderId,
      type: "FRIEND_REQUEST",
      title: "Friend request accepted",
      message: `${userName} accepted your friend request`,
      link: "/friends",
    });
    return { notification };
  });
  publishNotification(notification);
}

export async function rejectFriendRequest(requestId: string, userId: string) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError(404, "Friend request not found");
  }

  if (request.receiverId !== userId) {
    throw new AppError(403, "Not authorized to reject this request");
  }

  if (request.status !== "PENDING") {
    throw new AppError(400, "Friend request is not pending");
  }

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", respondedAt: new Date() },
  });
}

export async function listFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: { userId },
    select: {
      friend: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  return friendships.map((f) => f.friend);
}

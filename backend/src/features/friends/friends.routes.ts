import { Router } from "express";
import { prisma } from "../../shared/prisma.js";
import { requireAuth } from "../../shared/middleware/auth.js";
import { success, message, created } from "../../shared/response.js";
import { AppError } from "../../shared/errors.js";

const router = Router();

router.use(requireAuth);

router.get("/users/search", async (req, res, next) => {
  try {
    const query = (req.query.query as string)?.trim();
    if (!query || query.length < 2) {
      throw new AppError(400, "Search query must be at least 2 characters");
    }

    const currentUserId = req.user!.id;

    const users = await prisma.user.findMany({
      where: {
        NOT: { id: currentUserId },
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
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
      return success(res, { users: [] });
    }

    const userIds = users.map((u) => u.id);

    const friendIds = new Set<string>();
    const friendships = await prisma.friendship.findMany({
      where: { userId: currentUserId, friendId: { in: userIds } },
      select: { friendId: true },
    });
    for (const f of friendships) {
      friendIds.add(f.friendId);
    }

    const sentRequests = new Map<string, string>();
    const receivedRequests = new Map<string, string>();
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: { in: userIds } },
          { receiverId: currentUserId, senderId: { in: userIds } },
        ],
        status: "PENDING",
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
      },
    });
    for (const fr of friendRequests) {
      if (fr.senderId === currentUserId) {
        sentRequests.set(fr.receiverId, fr.id);
      } else {
        receivedRequests.set(fr.senderId, fr.id);
      }
    }

    const result = users.map((user) => {
      let relationship: string;
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

    success(res, { users: result });
  } catch (error) {
    next(error);
  }
});

router.post("/friend-requests", async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user!.id;

    if (!receiverId || typeof receiverId !== "string") {
      throw new AppError(400, "receiverId is required");
    }

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
      return message(res, "Friend request already sent");
    }

    if (existingSent && existingSent.status === "REJECTED") {
      const request = await prisma.friendRequest.update({
        where: { id: existingSent.id },
        data: { status: "PENDING", respondedAt: null },
      });
      return created(res, { request: { id: request.id, senderId, receiverId, status: request.status } });
    }

    const existingReverse = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
    });

    if (existingReverse && existingReverse.status === "PENDING") {
      await prisma.$transaction(async (tx) => {
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
      });
      return message(res, "Friend request accepted");
    }

    const request = await prisma.friendRequest.create({
      data: { senderId, receiverId, status: "PENDING" },
    });

    created(res, { request: { id: request.id, senderId, receiverId, status: request.status } });
  } catch (error) {
    next(error);
  }
});

router.get("/friend-requests/received", async (req, res, next) => {
  try {
    const currentUserId = req.user!.id;

    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: currentUserId, status: "PENDING" },
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

    success(res, { requests });
  } catch (error) {
    next(error);
  }
});

router.patch("/friend-requests/:id/accept", async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const currentUserId = req.user!.id;

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError(404, "Friend request not found");
    }

    if (request.receiverId !== currentUserId) {
      throw new AppError(403, "Not authorized to accept this request");
    }

    if (request.status !== "PENDING") {
      throw new AppError(400, "Friend request is not pending");
    }

    await prisma.$transaction(async (tx) => {
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
    });

    message(res, "Friend request accepted");
  } catch (error) {
    next(error);
  }
});

router.patch("/friend-requests/:id/reject", async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const currentUserId = req.user!.id;

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError(404, "Friend request not found");
    }

    if (request.receiverId !== currentUserId) {
      throw new AppError(403, "Not authorized to reject this request");
    }

    if (request.status !== "PENDING") {
      throw new AppError(400, "Friend request is not pending");
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", respondedAt: new Date() },
    });

    message(res, "Friend request rejected");
  } catch (error) {
    next(error);
  }
});

router.get("/friends", async (req, res, next) => {
  try {
    const currentUserId = req.user!.id;

    const friendships = await prisma.friendship.findMany({
      where: { userId: currentUserId },
      select: {
        friend: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    const friends = friendships.map((f) => f.friend);

    success(res, { friends });
  } catch (error) {
    next(error);
  }
});

export default router;

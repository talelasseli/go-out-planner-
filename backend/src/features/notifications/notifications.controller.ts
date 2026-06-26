import type { Request, Response } from "express";
import { notificationIdParamSchema, cursorQuerySchema } from "./notifications.validation.js";
import * as notificationService from "./notifications.service.js";
import { success, message } from "../../shared/response.js";

export async function streamNotifications(req: Request, res: Response) {
  const userId = req.user!.id;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  const { addClient, removeClient, sendToUser } = await import("../../lib/sse.js");
  addClient(userId, res);

  res.write("event: connected\ndata: {\"type\":\"connected\"}\n\n");

  const { items: recentNotifications } = await notificationService.listNotifications(userId, undefined, 5);
  res.write(`event: initial\ndata: ${JSON.stringify({ notifications: recentNotifications })}\n\n`);

  const keepalive = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(keepalive);
    removeClient(userId, res);
  });
}

export async function list(req: Request, res: Response) {
  const { cursor, limit } = cursorQuerySchema.parse(req.query);
  const result = await notificationService.listNotifications(req.user!.id, cursor, limit);
  success(res, result);
}

export async function getUnreadCount(req: Request, res: Response) {
  const count = await notificationService.getUnreadCount(req.user!.id);
  success(res, { unreadCount: count });
}

export async function markRead(req: Request, res: Response) {
  const { id } = notificationIdParamSchema.parse(req.params);
  await notificationService.markRead(id, req.user!.id);
  message(res, "Notification marked as read");
}

export async function markAllRead(req: Request, res: Response) {
  await notificationService.markAllRead(req.user!.id);
  message(res, "All notifications marked as read");
}

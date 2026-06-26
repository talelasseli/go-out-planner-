import { z } from "zod";

export const notificationIdParamSchema = z.object({
  id: z.string().min(1, "Notification ID is required"),
});

export const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

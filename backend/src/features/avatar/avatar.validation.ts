import { z } from "zod";

export const uploadUrlSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
}).strict();

export const completeUploadSchema = z.object({
  objectKey: z.string().min(1).max(500),
}).strict();

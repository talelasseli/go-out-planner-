import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  username: z.string().trim().min(2).max(30).optional(),
  displayUsername: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(500).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
}).strict();

export const deleteAccountSchema = z.object({
  password: z.string().min(1),
}).strict();

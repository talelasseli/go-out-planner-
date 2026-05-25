import { z } from "zod";

export const createProfileSchema = z.object({
  username: z.string().min(1).max(50),
  displayName: z.string().max(100).optional(),
});

export const searchUsersSchema = z.object({
  query: z.string().min(1).max(100),
});

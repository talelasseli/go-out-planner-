import { z } from "zod";

export const searchUsersSchema = z.object({
  query: z.string().trim().min(2).max(50),
}).strict();

export const sendFriendRequestSchema = z.object({
  receiverId: z.string().min(1),
}).strict();

export const requestIdParamSchema = z.object({
  id: z.string().min(1),
}).strict();

export type SearchUsersDto = z.output<typeof searchUsersSchema>;
export type SendFriendRequestDto = z.output<typeof sendFriendRequestSchema>;
export type RequestIdParams = z.output<typeof requestIdParamSchema>;

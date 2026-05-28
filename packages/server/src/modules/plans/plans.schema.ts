import { z } from "zod";

export const createPlanSchema = z.object({
  title: z.string().min(1).max(200),
  planDate: z.string(),
  planTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  place: z.string().min(1).max(300),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  meetupPlace: z.string().max(300).optional(),
  activities: z.array(z.string().max(100)).optional().default([]),
  invitedFriendIds: z.array(z.string().uuid()).min(1),
});

export const editPlanSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  planDate: z.string().optional(),
  planTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format").optional(),
  place: z.string().min(1).max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  meetupPlace: z.string().max(300).optional(),
  activities: z.array(z.string().max(100)).optional(),
  invitedFriendIds: z.array(z.string().uuid()).optional(),
});

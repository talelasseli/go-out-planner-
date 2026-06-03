import { z } from "zod";

const futureDateTime = z.iso.datetime({ offset: true }).refine(
  (val) => new Date(val).getTime() > Date.now(),
  { message: "Scheduled date must be a future datetime" },
);

export const createPlanSchema = z.object({
  title: z.string().trim().min(3).max(150),
  scheduledAt: futureDateTime,
  place: z.string().trim().min(2).max(255),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  activities: z
    .array(z.string().trim().min(1).max(100))
    .min(1)
    .max(10),
  invitedUserIds: z
    .array(z.string().min(1))
    .min(1)
    .max(20)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Duplicate invited users are not allowed",
    }),
})
  .strict()
  .refine(
    (d) => (d.latitude == null) === (d.longitude == null),
    { message: "Both latitude and longitude must be provided together", path: ["latitude"] },
  );

export const planIdParamSchema = z.object({
  planId: z.string().min(1),
}).strict();

export type CreatePlanDto = z.output<typeof createPlanSchema>;
export type PlanIdParams = z.output<typeof planIdParamSchema>;

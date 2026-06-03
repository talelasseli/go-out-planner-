import { z } from "zod";

export const invitationIdParamSchema = z.object({
  invitationId: z.string().min(1),
}).strict();

export type InvitationIdParams = z.output<typeof invitationIdParamSchema>;

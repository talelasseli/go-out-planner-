import type { Request, Response } from "express";
import { invitationIdParamSchema } from "./invitations.validation.js";
import * as invitationService from "./invitations.service.js";
import { success, message } from "../../shared/response.js";

export async function list(req: Request, res: Response) {
  const invitations = await invitationService.listInvitations(req.user!.id);
  success(res, { invitations });
}

export async function accept(req: Request, res: Response) {
  const { invitationId } = invitationIdParamSchema.parse(req.params);
  await invitationService.acceptInvitation(invitationId, req.user!.id, req.user!.name ?? "Someone");
  message(res, "Invitation accepted");
}

export async function decline(req: Request, res: Response) {
  const { invitationId } = invitationIdParamSchema.parse(req.params);
  await invitationService.declineInvitation(invitationId, req.user!.id, req.user!.name ?? "Someone");
  message(res, "Invitation declined");
}

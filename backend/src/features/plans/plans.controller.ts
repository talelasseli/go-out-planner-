import type { Request, Response } from "express";
import { createPlanSchema, planIdParamSchema } from "./plans.validation.js";
import * as planService from "./plans.service.js";
import { success, message, created } from "../../shared/response.js";

export async function create(req: Request, res: Response) {
  const data = createPlanSchema.parse(req.body);
  const plan = await planService.createPlan(data, req.user!.id, req.user!.name ?? "Someone");
  created(res, { plan });
}

export async function listCreated(req: Request, res: Response) {
  const plans = await planService.getCreatedPlans(req.user!.id);
  success(res, { plans });
}

export async function listInvited(req: Request, res: Response) {
  const plans = await planService.getInvitedPlans(req.user!.id);
  success(res, { plans });
}

export async function getById(req: Request, res: Response) {
  const { planId } = planIdParamSchema.parse(req.params);
  const plan = await planService.getPlanById(planId, req.user!.id);
  success(res, { plan });
}

export async function cancel(req: Request, res: Response) {
  const { planId } = planIdParamSchema.parse(req.params);
  await planService.cancelPlan(planId, req.user!.id);
  message(res, "Plan cancelled");
}

export async function remove(req: Request, res: Response) {
  const { planId } = planIdParamSchema.parse(req.params);
  await planService.deletePlan(planId, req.user!.id);
  message(res, "Plan deleted");
}


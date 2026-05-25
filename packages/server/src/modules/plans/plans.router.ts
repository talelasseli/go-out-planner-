import { Router } from "express";
import { prisma } from "../../prisma.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validate } from "../../middleware/validate.js";
import { createPlanSchema, editPlanSchema } from "./plans.schema.js";
import * as plansService from "./plans.service.js";
import * as usersService from "../users/users.service.js";

const router = Router();

router.post("/plans", requireAuth, validate(createPlanSchema), async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const plan = await plansService.createPlan(prisma, profile.id, req.body);
    res.status(201).json(plan);
  } catch (e) {
    next(e);
  }
});

router.get("/plans/created", requireAuth, async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const plans = await plansService.getCreatedPlans(prisma, profile.id);
    res.json(plans);
  } catch (e) {
    next(e);
  }
});

router.get("/plans/invited", requireAuth, async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const plans = await plansService.getInvitedPlans(prisma, profile.id);
    res.json(plans);
  } catch (e) {
    next(e);
  }
});

router.get("/plans/:planId", requireAuth, async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const plan = await plansService.getPlanById(prisma, req.params.planId, profile.id);
    res.json(plan);
  } catch (e) {
    next(e);
  }
});

router.patch("/plans/:planId", requireAuth, validate(editPlanSchema), async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const plan = await plansService.editPlan(prisma, profile.id, req.params.planId, req.body);
    res.json(plan);
  } catch (e) {
    next(e);
  }
});

router.patch("/plans/:planId/cancel", requireAuth, async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    const plan = await plansService.cancelPlan(prisma, profile.id, req.params.planId);
    res.json(plan);
  } catch (e) {
    next(e);
  }
});

router.delete("/plans/:planId", requireAuth, async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    await plansService.deletePlan(prisma, profile.id, req.params.planId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;

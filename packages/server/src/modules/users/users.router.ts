import { Router } from "express";
import { prisma } from "../../prisma.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validate } from "../../middleware/validate.js";
import { createProfileSchema } from "./users.schema.js";
import * as usersService from "./users.service.js";

const router = Router();

router.post("/users/profile", requireAuth, validate(createProfileSchema), async (req, res, next) => {
  try {
    const profile = await usersService.createProfile(
      prisma,
      req.userId!,
      req.body,
    );
    res.status(201).json(profile);
  } catch (e) {
    next(e);
  }
});

router.get("/users/me", requireAuth, async (req, res, next) => {
  try {
    const profile = await usersService.assertProfileExists(prisma, req.userId!);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

router.get("/users/search", requireAuth, async (req, res, next) => {
  try {
    const query = req.query.query as string;
    if (!query || query.length < 1) {
      res.status(400).json({ error: "Query parameter is required" });
      return;
    }
    const profiles = await usersService.searchProfiles(prisma, query, req.userId!);
    res.json(profiles);
  } catch (e) {
    next(e);
  }
});

export default router;

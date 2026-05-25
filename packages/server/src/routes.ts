import { Router } from "express";
import usersRouter from "./modules/users/users.router.js";
import friendsRouter from "./modules/friends/friends.router.js";
import plansRouter from "./modules/plans/plans.router.js";
import invitationsRouter from "./modules/invitations/invitations.router.js";

const router = Router();

router.use(usersRouter);
router.use(friendsRouter);
router.use(plansRouter);
router.use(invitationsRouter);

export default router;

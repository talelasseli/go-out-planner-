import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../lib/auth.js";

const router = Router();

router.get("/me", async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    res.json({ success: true, data: session.user });
  } catch (error) {
    next(error);
  }
});

export default router;

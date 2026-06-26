import express from "express";
import helmet from "helmet";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { errorHandler } from "./shared/errors.js";
import { authLimiter, generalLimiter } from "./shared/rate-limit.js";
import { requireSafeOrigin } from "./shared/middleware/origin-check.js";
import authRoutes from "./features/auth/auth.routes.js";
import friendsRoutes from "./features/friends/friends.routes.js";
import plansRoutes from "./features/plans/plans.routes.js";
import invitationsRoutes from "./features/invitations/invitations.routes.js";
import profileRoutes from "./features/profile/profile.routes.js";
import avatarRoutes from "./features/avatar/avatar.routes.js";
import notificationsRoutes from "./features/notifications/notifications.routes.js";
import { auth } from "./lib/auth.js";
import { env } from "./shared/env.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity:
      env.NODE_ENV === "production"
        ? { maxAge: 63072000, includeSubDomains: true, preload: true }
        : false,
    xFrameOptions: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

app.use(cors({ origin: env.corsOriginList, credentials: true }));

app.use("/api/auth", authLimiter);

app.use("/api/auth", authRoutes);

app.all("/api/auth/{*any}", async (req, res, next) => {
  try {
    await toNodeHandler(auth)(req, res);
  } catch (error) {
    next(error);
  }
});

app.use("/api", generalLimiter);
app.use("/api", requireSafeOrigin);

app.use(express.json());

app.use("/api", friendsRoutes);
app.use("/api", plansRoutes);
app.use("/api", invitationsRoutes);
app.use("/api", profileRoutes);
app.use("/api", avatarRoutes);
app.use("/api", notificationsRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.use(errorHandler);

export default app;

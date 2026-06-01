import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { errorHandler } from "./shared/errors.js";
import authRoutes from "./features/auth/auth.routes.js";
import friendsRoutes from "./features/friends/friends.routes.js";
import { auth } from "./lib/auth.js";

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use("/api/auth", authRoutes);

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

app.use("/api", friendsRoutes);

app.use(errorHandler);

export default app;

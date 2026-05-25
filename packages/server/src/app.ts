import express from "express";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL ?? "http://localhost:5173",
  credentials: true,
}));

app.use(helmet());

app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

app.use("/api", routes);

app.use(errorHandler);

export default app;

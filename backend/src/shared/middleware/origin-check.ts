import { Request, Response, NextFunction } from "express";
import { env } from "../env.js";

const ALLOWED_ORIGINS = new Set(env.corsOriginList);
const REJECT_MISSING_ORIGIN = env.NODE_ENV === "production";
const UNSAFE_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export function requireSafeOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!UNSAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.headers.origin;

  if (!origin) {
    if (REJECT_MISSING_ORIGIN) {
      res.status(403).json({
        success: false,
        message: "Forbidden origin",
      });
      return;
    }
    return next();
  }

  if (origin === "null") {
    res.status(403).json({
      success: false,
      message: "Forbidden origin",
    });
    return;
  }

  if (!ALLOWED_ORIGINS.has(origin)) {
    res.status(403).json({
      success: false,
      message: "Forbidden origin",
    });
    return;
  }

  next();
}

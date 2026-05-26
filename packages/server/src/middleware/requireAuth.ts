import type { Request, Response, NextFunction } from "express";
import { auth } from "../auth.js";
import { AppError } from "../lib/AppError.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await auth.api.getSession({ headers: req.headers as HeadersInit });

    if (!session) {
      throw new AppError(401, "Unauthorized");
    }

    req.userId = session.user.id;
    next();
  } catch (e) {
    next(e);
  }
}

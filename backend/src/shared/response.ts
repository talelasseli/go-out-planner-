import { Response } from "express";

export function success(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

export function message(res: Response, message: string, statusCode = 200) {
  res.status(statusCode).json({ success: true, message });
}

export function created(res: Response, data: unknown) {
  success(res, data, 201);
}

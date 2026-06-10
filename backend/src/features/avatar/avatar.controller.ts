import type { Request, Response } from "express";
import { uploadUrlSchema, completeUploadSchema } from "./avatar.validation.js";
import * as avatarService from "./avatar.service.js";
import { success } from "../../shared/response.js";

export async function getUploadUrl(req: Request, res: Response) {
  const { contentType } = uploadUrlSchema.parse(req.body);
  const result = await avatarService.generateUploadUrl(req.user!.id, contentType);
  success(res, result, 201);
}

export async function completeUpload(req: Request, res: Response) {
  const { objectKey } = completeUploadSchema.parse(req.body);
  const result = await avatarService.completeUpload(req.user!.id, objectKey);
  success(res, result);
}

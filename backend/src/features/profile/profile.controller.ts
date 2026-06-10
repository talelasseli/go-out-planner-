import type { Request, Response } from "express";
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "./profile.validation.js";
import * as profileService from "./profile.service.js";
import { success, message } from "../../shared/response.js";

export async function getProfile(req: Request, res: Response) {
  const profile = await profileService.getProfile(req.user!.id);
  success(res, { profile });
}

export async function updateProfile(req: Request, res: Response) {
  const data = updateProfileSchema.parse(req.body);
  const profile = await profileService.updateProfile(req.user!.id, data);
  success(res, { profile });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  await profileService.changePassword(req.headers, currentPassword, newPassword);
  message(res, "Password changed successfully");
}

export async function deleteAccount(req: Request, res: Response) {
  const { password } = deleteAccountSchema.parse(req.body);
  await profileService.deleteAccount(req.headers, password);
  message(res, "Account deleted successfully");
}

import { prisma } from "../../shared/prisma.js";
import { AppError } from "../../shared/errors.js";
import { auth } from "../../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import type { Prisma } from "@prisma/client";
import type { ProfileResponse, UpdateProfileInput } from "./profile.types.js";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  username: true,
  displayUsername: true,
  bio: true,
  location: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export async function getProfile(userId: string): Promise<ProfileResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user as ProfileResponse;
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileInput,
): Promise<ProfileResponse> {
  if (data.username) {
    const existing = await prisma.user.findUnique({
      where: { username: data.username },
      select: { id: true },
    });

    if (existing && existing.id !== userId) {
      throw new AppError(409, "Username is already taken");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: safeUserSelect,
  });

  return user as ProfileResponse;
}

export async function changePassword(
  headers: Record<string, string | string[] | undefined>,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword },
      headers: fromNodeHeaders(headers),
    });
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;

    const err = error as { statusCode?: number; message?: string };
    if (err.statusCode && err.message) {
      throw new AppError(err.statusCode, err.message);
    }
    throw new AppError(500, "Failed to change password");
  }
}

export async function deleteAccount(
  headers: Record<string, string | string[] | undefined>,
  password: string,
): Promise<void> {
  try {
    await auth.api.deleteUser({
      body: { password },
      headers: fromNodeHeaders(headers),
    });
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;

    const err = error as { statusCode?: number; message?: string };
    if (err.statusCode && err.message) {
      throw new AppError(err.statusCode, err.message);
    }
    throw new AppError(500, "Failed to delete account");
  }
}

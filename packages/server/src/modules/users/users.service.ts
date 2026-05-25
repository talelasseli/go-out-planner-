import type { PrismaClient } from "@prisma/client";
import { AppError } from "../../lib/AppError.js";

export function createProfile(
  prisma: PrismaClient,
  userId: string,
  data: { username: string; displayName?: string },
) {
  return prisma.profile.create({
    data: {
      userId,
      username: data.username,
      displayName: data.displayName,
    },
  });
}

export function getProfileByUserId(prisma: PrismaClient, userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}

export async function searchProfiles(
  prisma: PrismaClient,
  query: string,
  excludeUserId: string,
) {
  const profiles = await prisma.profile.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
      ],
      userId: { not: excludeUserId },
    },
    take: 20,
  });
  return profiles;
}

export async function assertProfileExists(
  prisma: PrismaClient,
  userId: string,
) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw new AppError(404, "Profile not found. Set up your profile first.");
  return profile;
}

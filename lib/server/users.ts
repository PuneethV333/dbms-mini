import type { UserDto } from "@/lib/types";
import { cacheDel, cacheGet, cacheSet } from "./cache";
import { ApiError, isUniqueConstraintError } from "./errors";
import { toUserDto } from "./auth";
import { prisma } from "./db";

const PROFILE_CACHE_TTL_SECONDS = 60;

export async function getProfile(userId: string): Promise<UserDto> {
  const cacheKey = `profile:${userId}`;
  const cached = await cacheGet<UserDto>(cacheKey);
  if (cached) return cached;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "No local user record found.");
  const dto = toUserDto(user);
  await cacheSet(cacheKey, dto, PROFILE_CACHE_TTL_SECONDS);
  return dto;
}

export async function updateProfile(
  userId: string,
  dto: { name?: string; phone?: string | null },
): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "No local user record found.");

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
    });
    await cacheDel(`profile:${userId}`);
    return toUserDto(updated);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, "That phone number is already in use.");
    }
    throw error;
  }
}

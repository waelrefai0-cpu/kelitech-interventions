import type { User } from "@prisma/client";

export function sanitizeUser(user: User) {
  const { passwordHash, ...safeUser } = user;
  void passwordHash;
  return safeUser;
}

export function normalizeTags(tags?: string[] | string) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((tag) => tag.trim()).filter(Boolean);
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}


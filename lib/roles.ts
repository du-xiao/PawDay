export const USER_ROLES = {
  OWNER: "OWNER",
  GUEST: "GUEST",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export function normalizeRole(role?: string | null): UserRole {
  return role === USER_ROLES.GUEST ? USER_ROLES.GUEST : USER_ROLES.OWNER;
}

export function isGuestRole(role?: string | null) {
  return normalizeRole(role) === USER_ROLES.GUEST;
}

export function roleLabel(role?: string | null) {
  return isGuestRole(role) ? "访客" : "主人";
}

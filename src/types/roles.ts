// ---------------------------------------------------------------------------
// Client-Safe UserRole Enum
// ---------------------------------------------------------------------------
// Separate from `@/generated/prisma/client` to prevent importing Node.js
// built-in modules (`node:module`, `fs`, etc.) into Next.js Client Components
// which causes Turbopack browser chunking panics.
// ---------------------------------------------------------------------------

export enum UserRole {
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
  OWNER = "OWNER",
  HOUSEKEEPING = "HOUSEKEEPING",
  USER = "USER",
  TENANT = "TENANT",
  CUSTOM = "CUSTOM",
}

export type UserRoleType = `${UserRole}`;

import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// ---------------------------------------------------------------------------
// Prisma Client Singleton — with @prisma/adapter-pg for Prisma ORM 7
// ---------------------------------------------------------------------------
// Uses the transaction-mode pooler (DATABASE_URL) for runtime queries.
// In development the instance is cached on `globalThis` so it survives
// Hot Module Replacement without exhausting the connection pool.
// ---------------------------------------------------------------------------

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL!;

function createPrismaClient() {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Auto-refresh stale HMR singleton if new schema models (e.g. ownerPaymentMethod) are missing
if (globalForPrisma.prisma && !(globalForPrisma.prisma as any).ownerPaymentMethod) {
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

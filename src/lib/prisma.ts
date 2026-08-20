import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ---------------------------------------------------------------------------
// Prisma Client Singleton — with @prisma/adapter-pg for Prisma ORM 7
// ---------------------------------------------------------------------------
// Uses the transaction-mode pooler (DATABASE_URL) for runtime queries.
// In development the instance is cached on `globalThis` so it survives
// Hot Module Replacement without exhausting the connection pool.
// ---------------------------------------------------------------------------

const connectionString = process.env.DATABASE_URL!;

function createPrismaClient() {
  const adapter = new PrismaPg(connectionString);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (globalForPrisma.prisma && !(globalForPrisma.prisma as any).saaSPaymentMethod) {
  // Clear stale cached client missing newly generated models in dev server memory
  delete globalForPrisma.prisma;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

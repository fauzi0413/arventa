import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("--- USERS ---");
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true },
  });
  console.log(users);

  console.log("\n--- TENANT PROFILES ---");
  const tenantProfiles = await prisma.tenantProfile.findMany({
    include: { user: true },
  });
  console.log(tenantProfiles);

  console.log("\n--- UNITS ---");
  const units = await prisma.unit.findMany({
    include: {
      unitUser: true,
      leases: {
        include: {
          tenant: { include: { user: true } },
          invoices: true,
        },
      },
    },
  });
  console.dir(units, { depth: null });

  console.log("\n--- ALL LEASES ---");
  const leases = await prisma.lease.findMany({
    include: {
      tenant: { include: { user: true } },
      unit: { include: { unitUser: true } },
      invoices: true,
    },
  });
  console.dir(leases, { depth: null });

  console.log("\n--- ALL INVOICES ---");
  const invoices = await prisma.invoice.findMany({
    include: {
      lease: {
        include: {
          tenant: { include: { user: true } },
          unit: { include: { unitUser: true } },
        },
      },
    },
  });
  console.dir(invoices, { depth: null });
}

main().finally(() => prisma.$disconnect());

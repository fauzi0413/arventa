import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = "apt12b01@arventa.id";
  const authUser = await prisma.user.findFirst({
    where: { email },
  });

  if (!authUser) {
    console.log("User not found");
    return;
  }

  console.log("Found authUser:", authUser.id, authUser.email, authUser.fullName);

  // 1. Find all tenantProfile IDs related to this authUser
  const tenantProfiles = await prisma.tenantProfile.findMany({
    where: {
      OR: [
        { userId: authUser.id },
        { email: authUser.email },
        { user: { email: authUser.email } },
        { leases: { some: { unit: { OR: [{ unitUserId: authUser.id }, { unitUser: { email: authUser.email } }] } } } },
      ],
    },
    select: { id: true, fullName: true, email: true },
  });

  console.log("Tenant profiles found:", tenantProfiles);

  const tenantIds = tenantProfiles.map((tp) => tp.id);

  // 2. Find all Unit IDs linked to this authUser
  const units = await prisma.unit.findMany({
    where: {
      OR: [
        { unitUserId: authUser.id },
        { unitUser: { email: authUser.email } },
      ],
    },
    select: { id: true, unitNumber: true },
  });

  console.log("Units found:", units);

  const unitIds = units.map((u) => u.id);

  // 3. Query all invoices matching EITHER the tenantIds OR the unitIds!
  const invoices = await prisma.invoice.findMany({
    where: {
      lease: {
        OR: [
          ...(tenantIds.length > 0 ? [{ tenantId: { in: tenantIds } }] : []),
          ...(unitIds.length > 0 ? [{ unitId: { in: unitIds } }] : []),
        ],
      },
    },
    orderBy: { dueDate: "desc" },
    include: {
      lease: {
        include: {
          tenant: true,
          unit: {
            include: {
              property: true,
            },
          },
        },
      },
    },
  });

  console.log("Invoices count:", invoices.length);
  console.dir(invoices, { depth: null });

  // 4. Check leases for unitIds
  const leases = await prisma.lease.findMany({
    where: {
      unitId: { in: unitIds },
    },
    include: {
      invoices: true,
    },
  });
  console.log("Leases for unitIds:", leases);
}

main().finally(() => prisma.$disconnect());

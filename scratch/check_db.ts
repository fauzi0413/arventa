import { prisma } from "../src/lib/prisma";

async function check() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true },
  });
  console.log("Users:", JSON.stringify(users, null, 2));

  const props = await prisma.property.findMany({
    select: { id: true, name: true, ownerId: true, owner: { select: { id: true, email: true, fullName: true } } },
  });
  console.log("Properties:", JSON.stringify(props, null, 2));

  const leases = await prisma.lease.findMany({
    select: {
      id: true,
      unit: {
        select: {
          unitNumber: true,
          property: { select: { id: true, name: true, ownerId: true, owner: { select: { id: true, email: true } } } },
        },
      },
    },
  });
  console.log("Leases count:", leases.length);
  leases.forEach((l) => {
    console.log(`Lease ${l.id} -> Unit ${l.unit?.unitNumber} -> Prop ${l.unit?.property?.name} -> Owner: ${l.unit?.property?.owner?.email} (ID: ${l.unit?.property?.ownerId})`);
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());

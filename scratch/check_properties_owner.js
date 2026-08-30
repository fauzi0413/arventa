const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: "OWNER" },
    select: { id: true, email: true, fullName: true },
  });
  console.log("Owners in database:", JSON.stringify(users, null, 2));

  const properties = await prisma.property.findMany({
    select: { id: true, name: true, ownerId: true, owner: { select: { email: true, fullName: true } } },
  });
  console.log("Properties in database:", JSON.stringify(properties, null, 2));

  const leases = await prisma.lease.findMany({
    select: {
      id: true,
      unit: {
        select: {
          unitNumber: true,
          property: { select: { name: true, ownerId: true, owner: { select: { email: true } } } },
        },
      },
    },
  });
  console.log("Leases count:", leases.length);
  leases.forEach((l) => {
    console.log(`Lease ${l.id} -> Unit ${l.unit?.unitNumber} -> Prop ${l.unit?.property?.name} -> Owner Email: ${l.unit?.property?.owner?.email}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

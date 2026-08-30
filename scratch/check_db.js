const { PrismaClient } = require("../generated/prisma/client");
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log("Users:", users);

  const props = await prisma.property.findMany({ include: { owner: true } });
  console.log("Properties:", props);

  const leases = await prisma.lease.findMany({
    include: {
      tenant: true,
      unit: { include: { property: { include: { owner: true } } } },
    },
  });
  console.log("Leases count:", leases.length);
  leases.forEach(l => {
    console.log("Lease ID:", l.id, "Property Owner Email:", l.unit?.property?.owner?.email);
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());

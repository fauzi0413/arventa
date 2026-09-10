import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "apt12b01@arventa.id" },
    include: {
      unitAccount: true,
      tenantProfile: true,
    },
  });
  console.log("User apt12b01:", JSON.stringify(user, null, 2));

  const unit = await prisma.unit.findFirst({
    where: {
      OR: [
        { unitUserId: user?.id },
        { unitNumber: "Apt 12B-01" },
        { unitNumber: "12B-01" },
        { unitNumber: "Apt 12B" },
      ],
    },
    include: {
      unitUser: true,
    },
  });
  console.log("Unit for apt12b01:", JSON.stringify(unit, null, 2));
}

main().finally(() => prisma.$disconnect());

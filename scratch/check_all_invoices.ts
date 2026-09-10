import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
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
  console.log("ALL INVOICES COUNT:", invoices.length);
  console.dir(invoices, { depth: null });
}

main().finally(() => prisma.$disconnect());

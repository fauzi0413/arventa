import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const leases = await prisma.lease.findMany({
    include: {
      unit: {
        include: {
          property: true,
        },
      },
      tenant: {
        include: {
          user: true,
        },
      },
      invoices: true,
    },
  });

  console.log(`Found ${leases.length} leases:`);
  for (const lease of leases) {
    console.log(`Lease ID: ${lease.id}`);
    console.log(`Tenant: ${lease.tenant.fullName || lease.tenant.user?.fullName}`);
    console.log(`Property: ${lease.unit.property.name}, Unit: ${lease.unit.unitNumber}`);
    console.log(`Start Date: ${lease.startDate.toISOString()}`);
    console.log(`End Date: ${lease.endDate.toISOString()}`);
    console.log(`Invoices count: ${lease.invoices.length}`);
    for (const inv of lease.invoices) {
      console.log(`  - Inv #${inv.invoiceNumber} | Status: ${inv.status} | CreatedAt: ${inv.createdAt.toISOString()} | DueDate: ${inv.dueDate.toISOString()}`);
    }
    console.log("-----------------------------------------");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

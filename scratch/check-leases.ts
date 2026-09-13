import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const leases = await prisma.lease.findMany({
    include: {
      tenant: true,
      unit: { include: { property: true } },
      invoices: true,
    },
  });

  console.log("=== ACTIVE LEASES IN DB ===");
  for (const l of leases) {
    console.log(JSON.stringify({
      id: l.id,
      tenantName: l.tenant.fullName,
      propertyName: l.unit.property.name,
      status: l.status,
      startDate: l.startDate,
      endDate: l.endDate,
      rentPrice: l.rentPrice,
      invoicesCount: l.invoices.length,
      invoices: l.invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        dueDate: inv.dueDate,
        status: inv.status,
        createdAt: inv.createdAt,
      })),
    }, null, 2));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

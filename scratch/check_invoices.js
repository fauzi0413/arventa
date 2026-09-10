require('dotenv').config();
const { PrismaClient } = require('./generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.invoice.count();
  console.log(`TOTAL INVOICES IN DB: ${count}`);

  const invoices = await prisma.invoice.findMany({
    include: {
      lease: {
        include: {
          unit: {
            include: {
              property: true
            }
          },
          tenant: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  console.log("\nINVOICES LIST IN DATABASE:");
  invoices.forEach(inv => {
    const tenantName = inv.lease?.tenant?.fullName || inv.lease?.tenant?.user?.fullName || "N/A";
    const propertyName = inv.lease?.unit?.property?.name || "N/A";
    const ownerId = inv.lease?.unit?.property?.ownerId || "N/A";
    console.log(`- ID: ${inv.id} | Inv #: ${inv.invoiceNumber} | Amount: ${inv.amount} | Total: ${inv.totalAmount} | Status: ${inv.status} | Tenant: ${tenantName} | Property: ${propertyName} | OwnerId: ${ownerId}`);
  });

  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    select: { id: true, email: true, fullName: true }
  });
  console.log("\nOWNERS IN DB:", JSON.stringify(owners, null, 2));

  const properties = await prisma.property.findMany({
    select: { id: true, name: true, ownerId: true }
  });
  console.log("\nPROPERTIES IN DB:", JSON.stringify(properties, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

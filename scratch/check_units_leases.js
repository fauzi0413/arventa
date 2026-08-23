const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const units = await prisma.unit.findMany({
    include: {
      leases: {
        include: {
          tenant: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  console.log('UNITS IN DB:');
  for (const u of units) {
    console.log(`Unit: ${u.unitNumber} (${u.status})`);
    if (u.leases.length > 0) {
      for (const l of u.leases) {
        console.log(`  Lease: ${l.id} | Status: ${l.status}`);
        console.log(`    TenantProfile ID: ${l.tenant?.id}`);
        console.log(`    TenantProfile Name: ${l.tenant?.fullName}`);
        console.log(`    TenantProfile Phone: ${l.tenant?.phoneNumber}`);
        console.log(`    Tenant User Name: ${l.tenant?.user?.fullName}`);
      }
    } else {
      console.log('  No leases');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

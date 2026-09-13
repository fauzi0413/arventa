import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/**
 * Script untuk mengisi defaultLateFee pada data Property di database PostgreSQL Supabase.
 */
async function syncPropertyDefaultLateFees() {
  console.log("🔄 Memulai sinkronisasi defaultLateFee pada data Property di database...");

  const properties = await prisma.property.findMany({
    include: {
      owner: true,
    },
  });

  console.log(`📋 Ditemukan ${properties.length} properti di database.\n`);

  for (const prop of properties) {
    const currentFee = Number(prop.defaultLateFee || 0);
    const targetFee = currentFee > 0 ? currentFee : 50000;

    const updated = await prisma.property.update({
      where: { id: prop.id },
      data: {
        defaultLateFee: targetFee,
      },
    });

    console.log(`✅ Updated Property: ${updated.name} (${updated.city})`);
    console.log(`   • Owner: ${prop.owner?.fullName || "Owner"}`);
    console.log(`   • Denda Keterlambatan Default: Rp ${Number(updated.defaultLateFee).toLocaleString("id-ID")}\n`);
  }

  console.log("🎉 Sinkronisasi denda keterlambatan default properti selesai dengan sukses!");
}

syncPropertyDefaultLateFees()
  .catch((e) => {
    console.error("❌ Error sinkronisasi denda properti:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

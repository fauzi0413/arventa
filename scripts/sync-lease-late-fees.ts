import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/**
 * Script untuk mengisi / memperbarui lateFeeAmount pada data Lease
 * yang ada di database PostgreSQL Supabase.
 */
async function syncLeaseLateFees() {
  console.log("🔄 Memulai sinkronisasi lateFeeAmount pada data Lease di database...");

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
    },
  });

  console.log(`📋 Ditemukan ${leases.length} kontrak sewa (Lease) di database.\n`);

  for (const lease of leases) {
    // Jika lateFeeAmount bernilai 0 atau belum terisi, set default Rp 50.000
    const currentLateFee = Number(lease.lateFeeAmount || 0);
    const targetLateFee = currentLateFee > 0 ? currentLateFee : 50000;

    const updated = await prisma.lease.update({
      where: { id: lease.id },
      data: {
        lateFeeAmount: targetLateFee,
      },
    });

    const tenantName = lease.tenant?.fullName || lease.tenant?.user?.fullName || "Penyewa";
    const propName = lease.unit?.property?.name || "Properti";

    console.log(`✅ Updated Lease: ${updated.id}`);
    console.log(`   • Penghuni: ${tenantName} (${propName} - Unit ${lease.unit?.unitNumber || "-"})`);
    console.log(`   • Harga Sewa: Rp ${Number(updated.rentPrice).toLocaleString("id-ID")}`);
    console.log(`   • Denda Keterlambatan Kontrak: Rp ${Number(updated.lateFeeAmount).toLocaleString("id-ID")}\n`);
  }

  console.log("🎉 Sinkronisasi lateFeeAmount kontrak selesai dengan sukses!");
}

syncLeaseLateFees()
  .catch((e) => {
    console.error("❌ Error saat sinkronisasi denda kontrak:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

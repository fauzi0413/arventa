import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/**
 * Script untuk membersihkan biaya utilitas (utilityAmount) dari data seeder di database PostgreSQL.
 * Mengeset utilityAmount = 0 dan menghitung ulang totalAmount = amount + penaltyAmount.
 */
async function cleanInvoiceUtilityFees() {
  console.log("🔄 Memulai penyesuaian data invoice di database...");

  const invoices = await prisma.invoice.findMany({
    include: {
      lease: {
        include: {
          unit: {
            include: { property: true },
          },
          tenant: {
            include: { user: true },
          },
        },
      },
    },
  });

  console.log(`📋 Ditemukan ${invoices.length} invoice di database.\n`);

  for (const inv of invoices) {
    const amount = Number(inv.amount);
    const utilityAmount = 0; // Reset ke 0 sesuai instruksi user (tanpa biaya utilitas seeder)
    const penaltyAmount = Number(inv.penaltyAmount);
    const newTotalAmount = amount + utilityAmount + penaltyAmount;

    const updated = await prisma.invoice.update({
      where: { id: inv.id },
      data: {
        utilityAmount: 0,
        totalAmount: newTotalAmount,
      },
    });

    const tenantName = inv.lease?.tenant?.fullName || inv.lease?.tenant?.user?.fullName || "Penyewa";

    console.log(`✅ Updated Invoice: #${updated.invoiceNumber}`);
    console.log(`   • Penghuni: ${tenantName}`);
    console.log(`   • Biaya Sewa Pokok: Rp ${amount.toLocaleString("id-ID")}`);
    console.log(`   • Biaya Utilitas (Reset): Rp 0`);
    console.log(`   • Denda Keterlambatan: Rp ${penaltyAmount.toLocaleString("id-ID")}`);
    console.log(`   • Total Tagihan Baru: Rp ${newTotalAmount.toLocaleString("id-ID")}\n`);
  }

  console.log("🎉 Penyesuaian biaya utilitas invoice selesai dengan sukses!");
}

cleanInvoiceUtilityFees()
  .catch((e) => {
    console.error("❌ Error penyesuaian invoice:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/**
 * Script untuk menyesuaikan dueDate (dan createdAt) invoice di database
 * agar selaras dengan end_date / start_date pada kontrak sewa (Lease).
 */
async function syncInvoiceDueDates() {
  console.log("🔄 Memulai sinkronisasi dueDate invoice dengan data Lease...");

  const invoices = await prisma.invoice.findMany({
    include: {
      lease: {
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
      },
    },
  });

  console.log(`📋 Ditemukan ${invoices.length} invoice di database.\n`);

  for (const inv of invoices) {
    if (!inv.lease) {
      console.warn(`⚠️ Invoice ${inv.invoiceNumber} tidak memiliki relasi Lease. Dilewati.`);
      continue;
    }

    const lease = inv.lease;
    const leaseEndDate = new Date(lease.endDate);
    const leaseStartDate = new Date(lease.startDate);

    // Tentukan Due Date baru berdasarkan Lease:
    // Menggunakan tanggal dari leaseEndDate (atau periode siklus sewa lease)
    let newDueDate = new Date(leaseEndDate);

    // Jika invoice dibuat untuk bulan berjalan tertentu, sesuaikan tanggal bulan dari invoice
    // namun menggunakan tanggal hari (day of month) dari lease endDate/startDate
    const targetMonth = new Date(inv.dueDate).getMonth();
    const targetYear = new Date(inv.dueDate).getFullYear();
    const dayOfMonth = leaseEndDate.getDate();

    newDueDate = new Date(targetYear, targetMonth, dayOfMonth);

    // Pastikan createdAt adalah H-7 sebelum due date
    const newCreatedAt = new Date(newDueDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Tentukan status jika diperlukan (PAID tetap PAID, PENDING/OVERDUE disesuaikan dengan waktu sekarang)
    const now = new Date();
    let updatedStatus = inv.status;
    if (inv.status !== "PAID" && inv.status !== "CANCELLED") {
      if (newDueDate < now) {
        updatedStatus = "OVERDUE";
      } else {
        updatedStatus = "PENDING";
      }
    }

    // Update record invoice di database PostgreSQL
    const updatedInv = await prisma.invoice.update({
      where: { id: inv.id },
      data: {
        dueDate: newDueDate,
        createdAt: newCreatedAt,
        status: updatedStatus,
      },
    });

    const tenantName = lease.tenant.fullName || lease.tenant.user?.fullName || "Penghuni";
    const propName = lease.unit.property.name;

    console.log(`✅ Updated Invoice: ${updatedInv.invoiceNumber}`);
    console.log(`   • Penghuni: ${tenantName} (${propName} - ${lease.unit.unitNumber})`);
    console.log(`   • Lease End Date: ${leaseEndDate.toLocaleDateString("id-ID")}`);
    console.log(`   • Tanggal Terbit Baru (H-7): ${newCreatedAt.toLocaleDateString("id-ID")}`);
    console.log(`   • Tanggal Jatuh Tempo Baru: ${newDueDate.toLocaleDateString("id-ID")}`);
    console.log(`   • Status: ${updatedInv.status}\n`);
  }

  console.log("🎉 Sinkronisasi due date invoice selesai dengan sukses!");
}

syncInvoiceDueDates()
  .catch((e) => {
    console.error("❌ Error saat sinkronisasi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

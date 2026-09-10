import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🛠️ Cleaning up and auto-aligning submenu parent IDs in DB...");

  // 1. Find or fix Keuangan & Penagihan root for Owner
  let ownerFinanceRoot = await prisma.menuItem.findFirst({
    where: {
      title: "Keuangan & Penagihan",
      parentId: null,
    },
  });

  if (ownerFinanceRoot && ownerFinanceRoot.path !== "/finance") {
    console.log(`Fixing Owner Finance Root path from ${ownerFinanceRoot.path} to /finance`);
    ownerFinanceRoot = await prisma.menuItem.update({
      where: { id: ownerFinanceRoot.id },
      data: { path: "/finance" },
    });
  }

  // 2. Fix submenus for Keuangan & Penagihan
  if (ownerFinanceRoot) {
    const subTitles = ["Pengeluaran Operasional (OpEx)", "Laporan & Analytics", "Manajemen Invoice"];
    for (const title of subTitles) {
      const sub = await prisma.menuItem.findFirst({
        where: { title },
      });
      if (sub && sub.parentId !== ownerFinanceRoot.id) {
        console.log(`Re-parenting "${sub.title}" -> "${ownerFinanceRoot.title}" (${ownerFinanceRoot.id})`);
        await prisma.menuItem.update({
          where: { id: sub.id },
          data: { parentId: ownerFinanceRoot.id },
        });
      }
    }
  }

  // 3. Fix submenus for Penyewa & Kontrak
  let ownerTenantRoot = await prisma.menuItem.findFirst({
    where: {
      title: "Penyewa & Kontrak",
      parentId: null,
    },
  });

  if (ownerTenantRoot) {
    const tenantSubTitles = ["Kontrak Penyewa", "Manajemen Penyewa"];
    for (const title of tenantSubTitles) {
      const sub = await prisma.menuItem.findFirst({
        where: { title },
      });
      if (sub && sub.parentId !== ownerTenantRoot.id) {
        console.log(`Re-parenting "${sub.title}" -> "${ownerTenantRoot.title}" (${ownerTenantRoot.id})`);
        await prisma.menuItem.update({
          where: { id: sub.id },
          data: { parentId: ownerTenantRoot.id },
        });
      }
    }
  }

  // 4. Fix submenus for Subscriptions & Billing (Platform Admin)
  let adminSaasRoot = await prisma.menuItem.findFirst({
    where: {
      title: "Subscriptions & Billing",
      parentId: null,
    },
  });

  if (adminSaasRoot) {
    const saasSubTitles = [
      "Subscription Package",
      "SaaS Invoice",
      "Payment Verification",
      "Transaction History",
      "Payment Methods",
    ];
    for (const title of saasSubTitles) {
      const sub = await prisma.menuItem.findFirst({
        where: { title },
      });
      if (sub && sub.parentId !== adminSaasRoot.id) {
        console.log(`Re-parenting "${sub.title}" -> "${adminSaasRoot.title}" (${adminSaasRoot.id})`);
        await prisma.menuItem.update({
          where: { id: sub.id },
          data: { parentId: adminSaasRoot.id },
        });
      }
    }
  }

  console.log("✨ All submenus successfully aligned in database.");
}

main().catch(console.error);

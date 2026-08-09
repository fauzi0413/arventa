import { prisma } from "../../src/lib/prisma";

/**
 * Seed Roles, Permissions, Menu Items, Role-Menu Mappings, and Feature Flags.
 */
export async function seedRolesAndMenus() {
  console.log("\n🔐 Seeding Roles, Permissions & Dynamic Menus (Idempotent)...");

  // 1. Roles
  const rolesData = [
    { name: "Platform Admin", code: "PLATFORM_ADMIN", isSystem: true, description: "Super Admin Platform ARVENTA" },
    { name: "Owner Properti", code: "OWNER", isSystem: true, description: "Pemilik Kos & Apartemen" },
    { name: "Housekeeping", code: "HOUSEKEEPING", isSystem: true, description: "Staf Lapangan Operasional" },
    { name: "Penyewa Kamar", code: "USER", isSystem: true, description: "Akun Terikat di Kamar" },
  ];

  for (const role of rolesData) {
    const existing = await prisma.role.findUnique({ where: { code: role.code } });
    if (!existing) {
      await prisma.role.create({ data: role });
      console.log(`✅ Created Role: ${role.name}`);
    }
  }

  // 2. Feature Flags
  const flagsData = [
    { key: "ocr_ktp_enabled", name: "OCR KTP AI Check-In", isEnabled: true, description: "Auto fill tenant data from KTP image" },
    { key: "room_account_enabled", name: "Akun Berbasis Kamar", isEnabled: true, description: "Auto generate room credentials" },
    { key: "resident_forum_enabled", name: "Forum Diskusi Penghuni", isEnabled: true, description: "Community discussion thread" },
  ];

  for (const flag of flagsData) {
    const existing = await prisma.featureFlag.findUnique({ where: { key: flag.key } });
    if (!existing) {
      await prisma.featureFlag.create({ data: flag });
      console.log(`✅ Created Feature Flag: ${flag.key}`);
    }
  }

  // 3. Menu Items
  const menuData = [
    { title: "Dashboard", path: "/", icon: "IconHome", order: 1 },
    { title: "Properti & Kamar", path: "/properties", icon: "IconBuilding", order: 2 },
    { title: "Penyewa", path: "/tenants", icon: "IconUsers", order: 3 },
    { title: "Keuangan", path: "/finance", icon: "IconCash", order: 4 },
    { title: "Status Kamar (Operations)", path: "/operations", icon: "IconClipboardCheck", order: 5 },
    { title: "Laporan", path: "/reports", icon: "IconChartBar", order: 6 },
    { title: "Portal Kamar Saya", path: "/room", icon: "IconBed", order: 7 },
  ];

  for (const menu of menuData) {
    const existing = await prisma.menuItem.findFirst({ where: { path: menu.path } });
    if (!existing) {
      await prisma.menuItem.create({ data: menu });
      console.log(`✅ Created Menu Item: ${menu.title}`);
    }
  }

  console.log("✨ Roles, Features, and Dynamic Menus successfully seeded.");
}

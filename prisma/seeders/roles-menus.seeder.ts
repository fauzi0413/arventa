import { prisma } from "../../src/lib/prisma";

/**
 * Seed Roles, Permissions, Menu Items, Role-Menu Mappings, and Feature Flags.
 * Strictly maintains 100% clean role separation.
 */
export async function seedRolesAndMenus() {
  console.log("\n🔐 Seeding Roles, Permissions & Dynamic Menus into Database...");

  // 1. Roles Definition
  const rolesData = [
    { name: "Platform Admin", code: "PLATFORM_ADMIN", isSystem: true, description: "Super Admin Platform ARVENTA" },
    { name: "Owner Properti", code: "OWNER", isSystem: true, description: "Pemilik Kos & Apartemen" },
    { name: "Housekeeping", code: "HOUSEKEEPING", isSystem: true, description: "Staf Lapangan Operasional" },
    { name: "Penyewa Kamar", code: "USER", isSystem: true, description: "Akun Terikat di Kamar" },
  ];

  const roleMap: Record<string, string> = {};

  for (const roleData of rolesData) {
    let role = await prisma.role.findUnique({ where: { code: roleData.code } });
    if (!role) {
      role = await prisma.role.create({ data: roleData });
      console.log(`✅ Created Role: ${role.name}`);
    }
    roleMap[role.code] = role.id;
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

  // 3. Complete Master List of Menu Items & Role Links (Strict Role Separation)
  const menuItemsData: Array<{
    title: string;
    path: string;
    icon: string;
    group: string;
    order: number;
    roles: string[];
  }> = [
    // --- PLATFORM ADMIN MENUS (Exclusively 6 Items) ---
    { title: "Executive Dashboard", path: "/platform/dashboard", icon: "IconHome", group: "UTAMA", order: 1, roles: ["PLATFORM_ADMIN"] },
    { title: "Owner Management", path: "/platform/owners", icon: "IconBuildingStore", group: "MANAJEMEN SAAS", order: 2, roles: ["PLATFORM_ADMIN"] },
    { title: "Subscriptions & Billing", path: "/platform/subscriptions", icon: "IconCash", group: "MANAJEMEN SAAS", order: 3, roles: ["PLATFORM_ADMIN"] },
    { title: "Role & Permission Management", path: "/platform/roles", icon: "IconLock", group: "SISTEM & KONFIGURASI", order: 4, roles: ["PLATFORM_ADMIN"] },
    { title: "Dynamic Menu Management", path: "/platform/menus", icon: "IconRoute", group: "SISTEM & KONFIGURASI", order: 5, roles: ["PLATFORM_ADMIN"] },
    { title: "Platform Settings & Integrasi", path: "/platform/settings", icon: "IconSettings", group: "SISTEM & KONFIGURASI", order: 6, roles: ["PLATFORM_ADMIN"] },

    // --- OWNER MENUS (Exclusively 5 Items) ---
    { title: "Dashboard Utama", path: "/owner/dashboard", icon: "IconHome", group: "UTAMA", order: 1, roles: ["OWNER"] },
    { title: "Properti & Manajemen Unit", path: "/properties", icon: "IconBuilding", group: "PROPERTI & OPERASIONAL", order: 2, roles: ["OWNER"] },
    { title: "Tim Operasional & Housekeeping", path: "/operations/housekeeping-team", icon: "IconSparkles", group: "PROPERTI & OPERASIONAL", order: 3, roles: ["OWNER"] },
    { title: "Penyewa & Kontrak", path: "/tenants", icon: "IconUsers", group: "PENYEWA & KEUANGAN", order: 4, roles: ["OWNER"] },
    { title: "Keuangan & Penagihan", path: "/finance", icon: "IconCash", group: "PENYEWA & KEUANGAN", order: 5, roles: ["OWNER"] },

    // --- HOUSEKEEPING MENUS (Exclusively 5 Items) ---
    { title: "Status Kamar Grid", path: "/housekeeping/room-grid", icon: "IconClipboardCheck", group: "LAPANGAN & UNIT", order: 1, roles: ["HOUSEKEEPING"] },
    { title: "Data Penghuni Lapangan", path: "/housekeeping/tenants", icon: "IconUserCheck", group: "LAPANGAN & UNIT", order: 2, roles: ["HOUSEKEEPING"] },
    { title: "Kondisi Perabotan & Unit", path: "/housekeeping/inventories", icon: "IconArmchair", group: "LAPANGAN & UNIT", order: 3, roles: ["HOUSEKEEPING"] },
    { title: "Keuangan & Penagihan Unit", path: "/housekeeping/unit-expenses", icon: "IconCash", group: "KEUANGAN & KOMUNITAS", order: 4, roles: ["HOUSEKEEPING"] },
    { title: "Komunitas & Pengumuman", path: "/housekeeping/community", icon: "IconMessages", group: "KEUANGAN & KOMUNITAS", order: 5, roles: ["HOUSEKEEPING"] },

    // --- USER (TENANT) MENUS (Exclusively 4 Items) ---
    { title: "Info Kamar Saya", path: "/portal/room", icon: "IconBed", group: "PORTAL KAMAR", order: 1, roles: ["USER"] },
    { title: "Kontrak & Dokumen", path: "/portal/contract", icon: "IconFileText", group: "PORTAL KAMAR", order: 2, roles: ["USER"] },
    { title: "Tagihan & Pembayaran", path: "/portal/invoices", icon: "IconReceipt", group: "PORTAL KAMAR", order: 3, roles: ["USER"] },
    { title: "Komunitas Properti", path: "/portal/community", icon: "IconMessages", group: "KOMUNITAS", order: 4, roles: ["USER"] },
  ];

  // 4. Wipe old menu_items and role_menus completely for a 100% clean database slate
  console.log("🧹 Wiping old menu_items and role_menus for clean re-seeding...");
  await prisma.roleMenu.deleteMany();
  await prisma.menuItem.deleteMany();

  // 5. Seed Unique Menu Items & Link to Roles
  for (const itemData of menuItemsData) {
    const { title, path, icon, group, order, roles: roleCodes } = itemData;

    const menuItem = await prisma.menuItem.create({
      data: { title, path, icon, group, order },
    });
    console.log(`✅ Created MenuItem: ${title} (${path}) [Group: ${group}]`);

    for (const code of roleCodes) {
      const roleId = roleMap[code];
      if (roleId) {
        await prisma.roleMenu.create({
          data: {
            roleId,
            menuItemId: menuItem.id,
          },
        });
        console.log(`  🔗 Linked Role: ${code}`);
      }
    }
  }

  console.log("✨ All Menu Items and Role Mappings seeded with strict role separation successfully.");
}

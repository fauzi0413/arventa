import { prisma } from "../../src/lib/prisma";

/**
 * Seed Roles, Permissions, Menu Items, Role-Menu Mappings, and Feature Flags.
 */
export async function seedRolesAndMenus() {
  console.log("\n🔐 Seeding Roles, Permissions & Dynamic Menus into Database...");

  // 1. Roles
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

  // 3. Unique Menu Items Mapping per Role (Clean 1..N order per role)
  const allRoleMenus: Record<string, Array<{ title: string; path: string; icon: string; order: number }>> = {
    PLATFORM_ADMIN: [
      { title: "Executive Dashboard", path: "/platform/dashboard", icon: "IconHome", order: 1 },
      { title: "Owner Management", path: "/platform/owners", icon: "IconBuildingStore", order: 2 },
      { title: "Subscriptions & Billing", path: "/platform/subscriptions", icon: "IconCash", order: 3 },
      { title: "Role & Permission Management", path: "/platform/roles", icon: "IconLock", order: 4 },
      { title: "Dynamic Menu Management", path: "/platform/menus", icon: "IconRoute", order: 5 },
      { title: "Platform Settings & Integrasi", path: "/platform/settings", icon: "IconSettings", order: 6 },
    ],
    OWNER: [
      { title: "Dashboard Utama", path: "/owner/dashboard", icon: "IconHome", order: 1 },
      { title: "Properti & Manajemen Unit", path: "/properties", icon: "IconBuilding", order: 2 },
      { title: "Tim Operasional & Housekeeping", path: "/operations/housekeeping-team", icon: "IconSparkles", order: 3 },
      { title: "Penyewa & Kontrak", path: "/tenants", icon: "IconUsers", order: 4 },
      { title: "Keuangan & Penagihan", path: "/finance", icon: "IconCash", order: 5 },
    ],
    HOUSEKEEPING: [
      { title: "Status Kamar Grid", path: "/housekeeping/room-grid", icon: "IconClipboardCheck", order: 1 },
      { title: "Data Penghuni Lapangan", path: "/housekeeping/tenants", icon: "IconUserCheck", order: 2 },
      { title: "Kondisi Perabotan & Unit", path: "/housekeeping/inventories", icon: "IconArmchair", order: 3 },
      { title: "Keuangan & Penagihan Unit", path: "/housekeeping/unit-expenses", icon: "IconCash", order: 4 },
      { title: "Komunitas & Pengumuman", path: "/housekeeping/community", icon: "IconMessages", order: 5 },
    ],
    USER: [
      { title: "Info Kamar Saya", path: "/portal/room", icon: "IconBed", order: 1 },
      { title: "Kontrak & Dokumen", path: "/portal/contract", icon: "IconFileText", order: 2 },
      { title: "Tagihan & Pembayaran", path: "/portal/invoices", icon: "IconReceipt", order: 3 },
      { title: "Komunitas Properti", path: "/portal/community", icon: "IconMessages", order: 4 },
    ],
  };

  // Cleanup old unmapped menu items
  const validPaths = Object.values(allRoleMenus).flatMap((items) => items.map((i) => i.path));
  await prisma.menuItem.deleteMany({
    where: {
      path: { notIn: validPaths },
    },
  });

  for (const [roleCode, items] of Object.entries(allRoleMenus)) {
    const roleId = roleMap[roleCode];
    if (!roleId) continue;

    for (const item of items) {
      let menuItem = await prisma.menuItem.findFirst({
        where: { path: item.path },
      });

      if (!menuItem) {
        menuItem = await prisma.menuItem.create({ data: item });
        console.log(`✅ Created Unique MenuItem: [${roleCode}] ${menuItem.title} (${menuItem.path})`);
      } else {
        menuItem = await prisma.menuItem.update({
          where: { id: menuItem.id },
          data: { title: item.title, icon: item.icon, order: item.order },
        });
      }

      // Create RoleMenu mapping if not existing
      const roleMenuExists = await prisma.roleMenu.findUnique({
        where: {
          roleId_menuItemId: {
            roleId,
            menuItemId: menuItem.id,
          },
        },
      });

      if (!roleMenuExists) {
        await prisma.roleMenu.create({
          data: {
            roleId,
            menuItemId: menuItem.id,
          },
        });
        console.log(`🔗 Linked RoleMenu: ${roleCode} -> ${item.title}`);
      }
    }
  }

  console.log("✨ All Menu Items cleaned and updated per role in database successfully.");
}

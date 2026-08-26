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
    { name: "Penyewa Kamar", code: "TENANT", isSystem: true, description: "Akun Terikat di Kamar" },
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

  // 2. Seed Master Permissions (Module & Action Granular Grid)
  const modules = ["properties", "finance", "operations", "tenants", "reports", "settings"];
  const actions = ["create", "read", "update", "delete"];

  const permMap: Record<string, string> = {};

  for (const mod of modules) {
    for (const act of actions) {
      const permKey = `${mod}:${act}`;
      const existing = await prisma.permission.findUnique({
        where: { module_action: { module: mod, action: act } },
      });

      let perm = existing;
      if (!perm) {
        perm = await prisma.permission.create({
          data: {
            module: mod,
            action: act,
            description: `Akses ${act.toUpperCase()} untuk modul ${mod}`,
          },
        });
        console.log(`✅ Created Permission: ${mod}:${act}`);
      }
      permMap[permKey] = perm.id;
    }
  }

  // 3. Seed Default Role-Permission Granular Mappings
  console.log("🔒 Seeding Default Role-Permission Granular Mappings...");
  const rolePermissionAssignments: Record<string, string[]> = {
    PLATFORM_ADMIN: modules.flatMap((m) => actions.map((a) => `${m}:${a}`)),
    OWNER: [
      ...actions.map((a) => `properties:${a}`),
      ...actions.map((a) => `finance:${a}`),
      ...actions.map((a) => `operations:${a}`),
      ...actions.map((a) => `tenants:${a}`),
      ...actions.map((a) => `reports:${a}`),
      "settings:read",
      "settings:update",
    ],
    HOUSEKEEPING: [
      "properties:read",
      "operations:read",
      "operations:create",
      "operations:update",
    ],
    USER: [
      "tenants:read",
      "operations:read",
    ],
  };

  for (const [roleCode, permKeys] of Object.entries(rolePermissionAssignments)) {
    const roleId = roleMap[roleCode];
    if (!roleId) continue;

    for (const permKey of permKeys) {
      const permissionId = permMap[permKey];
      if (!permissionId) continue;

      const existingRP = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId, permissionId } },
      });

      if (!existingRP) {
        await prisma.rolePermission.create({
          data: { roleId, permissionId },
        });
      }
    }
  }

  // 4. Feature Flags
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

  // 3. Complete Master List of Menu Items & Role Links (Strict Role Separation & Submenus)
  const menuItemsData: Array<{
    title: string;
    path: string;
    icon: string;
    group: string;
    order: number;
    roles: string[];
    parentTitle?: string;
  }> = [
      // --- PLATFORM ADMIN MENUS ---
      { title: "Executive Dashboard", path: "/platform/dashboard", icon: "IconHome", group: "UTAMA", order: 1, roles: ["PLATFORM_ADMIN"] },
      { title: "Owner Management", path: "/platform/owners", icon: "IconBuildingStore", group: "MANAJEMEN SAAS", order: 2, roles: ["PLATFORM_ADMIN"] },
      { title: "Subscriptions & Billing", path: "/platform/subscription-&-billing", icon: "IconCash", group: "MANAJEMEN SAAS", order: 3, roles: ["PLATFORM_ADMIN"] },
      { title: "Subscription Package", path: "/platform/subscriptions", icon: "IconCash", group: "MANAJEMEN SAAS", order: 4, roles: ["PLATFORM_ADMIN"], parentTitle: "Subscriptions & Billing" },
      { title: "SaaS Invoice", path: "/platform/saas-invoice", icon: "IconReceipt", group: "MANAJEMEN SAAS", order: 5, roles: ["PLATFORM_ADMIN"], parentTitle: "Subscriptions & Billing" },
      { title: "Payment Verification", path: "/platform/payment-verification", icon: "IconUserCheck", group: "MANAJEMEN SAAS", order: 6, roles: ["PLATFORM_ADMIN"], parentTitle: "Subscriptions & Billing" },
      { title: "Transaction History", path: "/platform/transaction-history", icon: "IconUpload", group: "MANAJEMEN SAAS", order: 7, roles: ["PLATFORM_ADMIN"], parentTitle: "Subscriptions & Billing" },
      { title: "Payment Methods", path: "/platform/payment-methods", icon: "IconBuildingBank", group: "MANAJEMEN SAAS", order: 8, roles: ["PLATFORM_ADMIN"], parentTitle: "Subscriptions & Billing" },
      { title: "Role & Permission Management", path: "/platform/roles", icon: "IconLock", group: "SISTEM & KONFIGURASI", order: 8, roles: ["PLATFORM_ADMIN"] },
      { title: "Dynamic Menu Management", path: "/platform/menus", icon: "IconRoute", group: "SISTEM & KONFIGURASI", order: 10, roles: ["PLATFORM_ADMIN"] },
      { title: "Platform Settings & Integrasi", path: "/platform/settings", icon: "IconSettings", group: "SISTEM & KONFIGURASI", order: 11, roles: ["PLATFORM_ADMIN"] },
      { title: "FAQ Management", path: "/platform/faq", icon: "IconHelpCircle", group: "SISTEM & KONFIGURASI", order: 12, roles: ["PLATFORM_ADMIN"] },

      // --- OWNER MENUS ---
      { title: "Dashboard Utama", path: "/owner/dashboard", icon: "IconHome", group: "UTAMA", order: 1, roles: ["OWNER"] },
      { title: "Properti & Manajemen Unit", path: "/properties", icon: "IconBuilding", group: "PROPERTI & OPERASIONAL", order: 2, roles: ["OWNER"] },
      { title: "Tim Operasional & Housekeeping", path: "/operations/housekeeping-team", icon: "IconSparkles", group: "PROPERTI & OPERASIONAL", order: 5, roles: ["OWNER"] },
      { title: "Penyewa & Kontrak", path: "/tenant-&-contract", icon: "IconUsers", group: "PENYEWA & KEUANGAN", order: 7, roles: ["OWNER"] },
      { title: "Kontrak Penyewa", path: "/tenant-contract", icon: "IconFileText", group: "PENYEWA & KEUANGAN", order: 7, roles: ["OWNER"], parentTitle: "Penyewa & Kontrak" },
      { title: "Manajemen Penyewa", path: "/tenants", icon: "IconId", group: "PENYEWA & KEUANGAN", order: 7, roles: ["OWNER"], parentTitle: "Penyewa & Kontrak" },
      { title: "Keuangan & Penagihan", path: "/finance", icon: "IconCash", group: "PENYEWA & KEUANGAN", order: 9, roles: ["OWNER"] },
      { title: "Pengeluaran Operasional (OpEx)", path: "/finance/expenses", icon: "IconReceipt", group: "PENYEWA & KEUANGAN", order: 10, roles: ["OWNER"], parentTitle: "Keuangan & Penagihan" },
      { title: "Laporan & Analytics", path: "/reports", icon: "IconChartBar", group: "PENYEWA & KEUANGAN", order: 11, roles: ["OWNER"], parentTitle: "Keuangan & Penagihan" },
      { title: "FAQ & Bantuan", path: "/owner/faq", icon: "IconHelpCircle", group: "BANTUAN", order: 12, roles: ["OWNER"] },

      // --- HOUSEKEEPING MENUS ---
      { title: "Status Kamar Grid", path: "/housekeeping/room-grid", icon: "IconClipboardCheck", group: "LAPANGAN & UNIT", order: 1, roles: ["HOUSEKEEPING"] },
      { title: "Data Penghuni Lapangan", path: "/housekeeping/tenants", icon: "IconUserCheck", group: "LAPANGAN & UNIT", order: 3, roles: ["HOUSEKEEPING"] },
      { title: "Kondisi Perabotan & Unit", path: "/housekeeping/inventories", icon: "IconArmchair", group: "LAPANGAN & UNIT", order: 4, roles: ["HOUSEKEEPING"] },
      { title: "Keuangan & Penagihan Unit", path: "/housekeeping/unit-expenses", icon: "IconCash", group: "KEUANGAN & KOMUNITAS", order: 6, roles: ["HOUSEKEEPING"] },
      { title: "Komunitas & Pengumuman", path: "/housekeeping/community", icon: "IconMessages", group: "KEUANGAN & KOMUNITAS", order: 7, roles: ["HOUSEKEEPING"] },

      // --- USER (TENANT) MENUS ---
      { title: "Info Kamar Saya", path: "/portal/room", icon: "IconBed", group: "PORTAL KAMAR", order: 1, roles: ["USER"] },
      { title: "Kontrak & Dokumen", path: "/portal/contract", icon: "IconFileText", group: "PORTAL KAMAR", order: 3, roles: ["USER"] },
      { title: "Tagihan & Pembayaran", path: "/portal/invoices", icon: "IconReceipt", group: "PORTAL KAMAR", order: 4, roles: ["USER"] },
      { title: "Komunitas Properti", path: "/portal/community", icon: "IconMessages", group: "KOMUNITAS", order: 6, roles: ["USER"] },
    ];

  // 4. Wipe old menu_items and role_menus completely for a 100% clean database slate
  console.log("🧹 Wiping old menu_items and role_menus for clean re-seeding...");
  await prisma.roleMenu.deleteMany();
  await prisma.menuItem.deleteMany();

  // 5. Seed Unique Menu Items & Link to Roles (Two-Pass for Parent-Child Hierarchy)
  const createdMenuMap: Record<string, string> = {};

  // First Pass: Create Main Root Menus (without parentTitle)
  for (const itemData of menuItemsData.filter((i) => !i.parentTitle)) {
    const { title, path, icon, group, order, roles: roleCodes } = itemData;

    const menuItem = await prisma.menuItem.create({
      data: { title, path, icon, group, order, parentId: null },
    });
    createdMenuMap[title] = menuItem.id;
    console.log(`✅ Created Main MenuItem: ${title} (${path}) [Group: ${group}]`);

    for (const code of roleCodes) {
      const roleId = roleMap[code];
      if (roleId) {
        await prisma.roleMenu.create({
          data: { roleId, menuItemId: menuItem.id },
        });
        console.log(`  🔗 Linked Role: ${code}`);
      }
    }
  }

  // Second Pass: Create Submenus (with parentTitle)
  for (const itemData of menuItemsData.filter((i) => Boolean(i.parentTitle))) {
    const { title, path, icon, group, order, roles: roleCodes, parentTitle } = itemData;
    const parentId = parentTitle ? createdMenuMap[parentTitle] : null;

    const menuItem = await prisma.menuItem.create({
      data: { title, path, icon, group, order, parentId },
    });
    createdMenuMap[title] = menuItem.id;
    console.log(`✅ Created Submenu MenuItem: ${title} (${path}) [Parent: ${parentTitle}]`);

    for (const code of roleCodes) {
      const roleId = roleMap[code];
      if (roleId) {
        await prisma.roleMenu.create({
          data: { roleId, menuItemId: menuItem.id },
        });
        console.log(`  🔗 Linked Role: ${code}`);
      }
    }
  }

  console.log("✨ All Menu Items and Role Mappings seeded with strict role separation successfully.");
}

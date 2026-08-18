import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Fetch all Menu Items with Role Mappings
    const menuItems = await prisma.menuItem.findMany({
      include: {
        roleMenus: {
          include: {
            role: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    // 2. Fetch all Roles
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { createdAt: "asc" },
    });

    // 3. Fetch all Feature Flags
    const featureFlags = await prisma.featureFlag.findMany({
      orderBy: { createdAt: "asc" },
    });

    return ApiResponse.success({
      message: "Berhasil mengambil data master menu & feature flags",
      data: {
        menuItems: menuItems.map((m) => ({
          id: m.id,
          title: m.title,
          path: m.path,
          icon: m.icon,
          group: (m as any).group || "UTAMA",
          order: m.order,
          parentId: m.parentId,
          roles: m.roleMenus.map((rm) => rm.role),
        })),
        roles,
        featureFlags: featureFlags.map((f) => ({
          id: f.id,
          key: f.key,
          name: f.name,
          description: f.description,
          isEnabled: f.isEnabled,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/menus-flags error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil data master menu & feature flags",
      error,
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Toggle Feature Flag
    if (action === "TOGGLE_FLAG") {
      const { flagId } = body;
      if (!flagId) {
        return ApiResponse.error({
          message: "flagId wajib diisi",
          status: 400,
        });
      }

      const flag = await prisma.featureFlag.findUnique({ where: { id: flagId } });
      if (!flag) {
        return ApiResponse.error({
          message: "Feature flag tidak ditemukan",
          status: 404,
        });
      }

      const updated = await prisma.featureFlag.update({
        where: { id: flagId },
        data: { isEnabled: !flag.isEnabled },
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          action: "TOGGLE_FEATURE_FLAG",
          entityName: "FeatureFlag",
          entityId: updated.id,
          details: { key: updated.key, name: updated.name, isEnabled: updated.isEnabled },
          ipAddress: "127.0.0.1",
        },
      });

      return ApiResponse.success({
        message: `Feature flag "${updated.name}" (${updated.key}) diubah menjadi ${updated.isEnabled ? "AKTIF" : "NON-AKTIF"}`,
        data: updated,
      });
    }

    // 2. Create New Feature Flag
    if (action === "CREATE_FLAG") {
      const { key, name, description } = body;
      if (!key || !name) {
        return ApiResponse.error({
          message: "Key dan Nama feature flag wajib diisi",
          status: 400,
        });
      }

      const existing = await prisma.featureFlag.findUnique({ where: { key } });
      if (existing) {
        return ApiResponse.error({
          message: "Key feature flag sudah ada",
          status: 400,
        });
      }

      const newFlag = await prisma.featureFlag.create({
        data: {
          key,
          name,
          description,
          isEnabled: true,
        },
      });

      return ApiResponse.success({
        message: `Feature flag baru "${name}" berhasil ditambahkan`,
        data: newFlag,
      });
    }

    // 3. Create New Menu Item & Link to Roles
    if (action === "CREATE_MENU") {
      const { title, path, icon, group, order, roleCodes, parentId } = body;
      if (!title || !path) {
        return ApiResponse.error({
          message: "Judul dan Path menu wajib diisi",
          status: 400,
        });
      }

      const existing = await prisma.menuItem.findFirst({ where: { path } });
      if (existing) {
        return ApiResponse.error({
          message: "Path menu ini sudah terdaftar",
          status: 400,
        });
      }

      let orderVal = order ? parseInt(order, 10) : 0;
      if (!orderVal || isNaN(orderVal)) {
        const lastItem = await prisma.menuItem.findFirst({
          orderBy: { order: "desc" },
        });
        orderVal = lastItem ? lastItem.order + 1 : 1;
      }

      const menuItem = await prisma.menuItem.create({
        data: {
          title,
          path,
          icon: icon || "IconRoute",
          group: group || "UTAMA",
          order: orderVal,
          parentId: parentId || null,
        },
      });

      if (roleCodes && Array.isArray(roleCodes)) {
        const roles = await prisma.role.findMany({
          where: { code: { in: roleCodes } },
        });

        for (const role of roles) {
          await prisma.roleMenu.create({
            data: {
              roleId: role.id,
              menuItemId: menuItem.id,
            },
          });
        }
      }

      return ApiResponse.success({
        message: `Master menu "${title}" berhasil dibuat pada urutan #${orderVal}`,
        data: menuItem,
      });
    }

    // 3.5. Update Existing Menu Item & Role Links
    if (action === "UPDATE_MENU") {
      const { menuItemId, title, path, icon, group, order, roleCodes, parentId } = body;
      if (!menuItemId || !title || !path) {
        return ApiResponse.error({
          message: "menuItemId, Judul, dan Path menu wajib diisi",
          status: 400,
        });
      }

      const conflict = await prisma.menuItem.findFirst({
        where: {
          path,
          id: { not: menuItemId },
        },
      });

      if (conflict) {
        return ApiResponse.error({
          message: "Path menu ini sudah digunakan oleh menu lain",
          status: 400,
        });
      }

      const updatedMenu = await prisma.menuItem.update({
        where: { id: menuItemId },
        data: {
          title,
          path,
          icon: icon || "IconRoute",
          group: group || "UTAMA",
          order: order ? parseInt(order, 10) : 10,
          parentId: parentId && parentId !== menuItemId ? parentId : null,
        },
      });

      if (roleCodes && Array.isArray(roleCodes)) {
        await prisma.roleMenu.deleteMany({
          where: { menuItemId },
        });

        const roles = await prisma.role.findMany({
          where: { code: { in: roleCodes } },
        });

        for (const role of roles) {
          await prisma.roleMenu.create({
            data: {
              roleId: role.id,
              menuItemId: updatedMenu.id,
            },
          });
        }
      }

      return ApiResponse.success({
        message: `Master menu "${title}" berhasil diperbarui`,
        data: updatedMenu,
      });
    }

    // 4. Update Menu Order
    if (action === "UPDATE_MENU_ORDER") {
      const { menuItemId, order } = body;
      if (!menuItemId || order === undefined) {
        return ApiResponse.error({
          message: "menuItemId dan order wajib diisi",
          status: 400,
        });
      }

      const updated = await prisma.menuItem.update({
        where: { id: menuItemId },
        data: { order: parseInt(order, 10) },
      });

      return ApiResponse.success({
        message: `Urutan menu ${updated.title} berhasil diperbarui`,
        data: updated,
      });
    }

    // 5. Swap Menu Order Between Two Items (1-to-1 position swap)
    if (action === "SWAP_MENU_ORDER") {
      const { item1Id, item2Id } = body;
      if (!item1Id || !item2Id) {
        return ApiResponse.error({
          message: "item1Id dan item2Id wajib diisi",
          status: 400,
        });
      }

      const item1 = await prisma.menuItem.findUnique({ where: { id: item1Id } });
      const item2 = await prisma.menuItem.findUnique({ where: { id: item2Id } });

      if (!item1 || !item2) {
        return ApiResponse.error({
          message: "Menu tidak ditemukan",
          status: 404,
        });
      }

      let order1 = item1.order;
      let order2 = item2.order;

      if (order1 === order2) {
        order1 = order1;
        order2 = order1 + 1;
      }

      await prisma.$transaction([
        prisma.menuItem.update({
          where: { id: item1Id },
          data: { order: order2 },
        }),
        prisma.menuItem.update({
          where: { id: item2Id },
          data: { order: order1 },
        }),
      ]);

      return ApiResponse.success({
        message: `Posisi menu "${item1.title}" dan "${item2.title}" berhasil ditukar`,
        data: { item1Id, newOrder1: order2, item2Id, newOrder2: order1 },
      });
    }

    // 6. Delete Menu Item
    if (action === "DELETE_MENU") {
      const { menuItemId } = body;
      if (!menuItemId) {
        return ApiResponse.error({
          message: "menuItemId wajib diisi",
          status: 400,
        });
      }

      await prisma.menuItem.delete({ where: { id: menuItemId } });

      return ApiResponse.success({
        message: "Master menu berhasil dihapus",
      });
    }

    return ApiResponse.error({
      message: "Aksi tidak valid",
      status: 400,
    });
  } catch (error) {
    console.error("POST /api/admin/menus-flags error:", error);
    return ApiResponse.error({
      message: "Terjadi kesalahan server",
      error,
      status: 500,
    });
  }
}

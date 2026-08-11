import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

export async function GET() {
  try {
    // 1. Fetch all Roles with User & Permission counts
    const roles = await prisma.role.findMany({
      include: {
        users: { select: { id: true, fullName: true, email: true } },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Fetch all Permissions in DB
    let permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    // If permissions table is empty, seed standard module permissions
    if (permissions.length === 0) {
      const modules = ["properties", "finance", "operations", "tenants", "reports", "settings"];
      const actions = ["read", "create", "update", "delete"];

      for (const mod of modules) {
        for (const act of actions) {
          await prisma.permission.upsert({
            where: { module_action: { module: mod, action: act } },
            update: {},
            create: {
              module: mod,
              action: act,
              description: `Access ${act} for module ${mod}`,
            },
          });
        }
      }

      permissions = await prisma.permission.findMany({
        orderBy: [{ module: "asc" }, { action: "asc" }],
      });
    }

    // 3. Fetch all system users for role assignment
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        customRoleId: true,
        customRole: { select: { id: true, name: true, code: true } },
      },
      orderBy: { fullName: "asc" },
    });

    return ApiResponse.success({
      message: "Berhasil mengambil data role & permission",
      data: {
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          code: r.code,
          description: r.description,
          isSystem: r.isSystem,
          userCount: r.users.length,
          permissionIds: r.rolePermissions.map((rp) => rp.permissionId),
        })),
        permissions: permissions.map((p) => ({
          id: p.id,
          module: p.module,
          action: p.action,
          description: p.description,
        })),
        users: users.map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          customRoleId: u.customRoleId,
          customRoleName: u.customRole?.name || null,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/roles-permissions error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil data role & permission",
      error,
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Create New Custom Role
    if (action === "CREATE_ROLE") {
      const { name, code, description } = body;
      if (!name || !code) {
        return ApiResponse.error({
          message: "Nama dan Kode Role wajib diisi",
          status: 400,
        });
      }

      const existing = await prisma.role.findUnique({ where: { code } });
      if (existing) {
        return ApiResponse.error({
          message: "Kode Role sudah digunakan",
          status: 400,
        });
      }

      const newRole = await prisma.role.create({
        data: {
          name,
          code: code.toUpperCase(),
          description,
          isSystem: false,
        },
      });

      return ApiResponse.success({
        message: "Role baru berhasil dibuat",
        data: newRole,
      });
    }

    // 2. Toggle Role Permission Link
    if (action === "TOGGLE_PERMISSION") {
      const { roleId, permissionId } = body;
      if (!roleId || !permissionId) {
        return ApiResponse.error({
          message: "roleId dan permissionId wajib diisi",
          status: 400,
        });
      }

      const existingLink = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
      });

      if (existingLink) {
        await prisma.rolePermission.delete({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId,
            },
          },
        });
        return ApiResponse.success({
          message: "Permission dihapus dari role",
          data: { linked: false },
        });
      } else {
        await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId,
          },
        });
        return ApiResponse.success({
          message: "Permission berhasil ditambahkan ke role",
          data: { linked: true },
        });
      }
    }

    // 3. Assign Role to User
    if (action === "ASSIGN_USER_ROLE") {
      const { userId, roleCode, customRoleId } = body;
      if (!userId) {
        return ApiResponse.error({
          message: "userId wajib diisi",
          status: 400,
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          role: roleCode || "USER",
          customRoleId: customRoleId || null,
        },
      });

      return ApiResponse.success({
        message: "Role pengguna berhasil diperbarui",
        data: updatedUser,
      });
    }

    return ApiResponse.error({
      message: "Aksi tidak valid",
      status: 400,
    });
  } catch (error) {
    console.error("POST /api/admin/roles-permissions error:", error);
    return ApiResponse.error({
      message: "Terjadi kesalahan server",
      error,
      status: 500,
    });
  }
}

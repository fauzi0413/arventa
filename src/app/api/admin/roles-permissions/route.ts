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
        roles: roles.map((r) => {
          const systemUsers = users.filter((u) => u.role === r.code && !u.customRoleId).length;
          const customUsers = r.users.length;
          return {
            id: r.id,
            name: r.name,
            code: r.code,
            description: r.description,
            isSystem: r.isSystem,
            userCount: r.isSystem ? systemUsers + customUsers : customUsers,
            permissionIds: r.rolePermissions.map((rp) => rp.permissionId),
          };
        }),
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

      const existing = await prisma.role.findUnique({ where: { code: code.toUpperCase().trim() } });
      if (existing) {
        return ApiResponse.error({
          message: "Kode Role sudah digunakan",
          status: 400,
        });
      }

      const newRole = await prisma.role.create({
        data: {
          name,
          code: code.toUpperCase().trim(),
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

    // 4. Update Custom Role
    if (action === "UPDATE_ROLE") {
      const { id, name, code, description } = body;
      if (!id || !name || !code) {
        return ApiResponse.error({
          message: "ID, Nama, dan Kode Role wajib diisi",
          status: 400,
        });
      }

      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        return ApiResponse.error({
          message: "Role tidak ditemukan",
          status: 404,
        });
      }

      if (role.isSystem) {
        return ApiResponse.error({
          message: "Role bawaan sistem tidak dapat diubah",
          status: 400,
        });
      }

      const SYSTEM_USER_ROLES = ["PLATFORM_ADMIN", "OWNER", "HOUSEKEEPING", "USER", "TENANT"];
      const isSystemRoleEnum = SYSTEM_USER_ROLES.includes(role.code);

      // Check if role is used by any user
      const userCount = await prisma.user.count({
        where: isSystemRoleEnum
          ? {
              OR: [
                { customRoleId: id },
                { role: role.code as any },
              ],
            }
          : { customRoleId: id },
      });

      if (userCount > 0) {
        return ApiResponse.error({
          message: `Role ini sedang digunakan oleh ${userCount} pengguna dan tidak dapat diubah`,
          status: 400,
        });
      }

      const formattedCode = code.toUpperCase().trim();

      if (formattedCode !== role.code) {
        const existingCode = await prisma.role.findUnique({
          where: { code: formattedCode },
        });
        if (existingCode && existingCode.id !== id) {
          return ApiResponse.error({
            message: "Kode Role sudah digunakan oleh role lain",
            status: 400,
          });
        }
      }

      const updatedRole = await prisma.role.update({
        where: { id },
        data: {
          name,
          code: formattedCode,
          description,
        },
      });

      return ApiResponse.success({
        message: "Role berhasil diperbarui",
        data: updatedRole,
      });
    }

    // 5. Delete Custom Role
    if (action === "DELETE_ROLE") {
      const { id } = body;
      if (!id) {
        return ApiResponse.error({
          message: "ID Role wajib diisi",
          status: 400,
        });
      }

      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        return ApiResponse.error({
          message: "Role tidak ditemukan",
          status: 404,
        });
      }

      if (role.isSystem) {
        return ApiResponse.error({
          message: "Role bawaan sistem tidak dapat dihapus",
          status: 400,
        });
      }

      const SYSTEM_USER_ROLES = ["PLATFORM_ADMIN", "OWNER", "HOUSEKEEPING", "USER", "TENANT"];
      const isSystemRoleEnum = SYSTEM_USER_ROLES.includes(role.code);

      // Check if role is used by any user
      const userCount = await prisma.user.count({
        where: isSystemRoleEnum
          ? {
              OR: [
                { customRoleId: id },
                { role: role.code as any },
              ],
            }
          : { customRoleId: id },
      });

      if (userCount > 0) {
        return ApiResponse.error({
          message: `Role ini sedang digunakan oleh ${userCount} pengguna dan tidak dapat dihapus`,
          status: 400,
        });
      }

      await prisma.role.delete({
        where: { id },
      });

      return ApiResponse.success({
        message: "Role berhasil dihapus",
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


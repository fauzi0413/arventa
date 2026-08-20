import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

/**
 * GET /api/admin/owners
 * Fetch list of Property Owners with active subscription, property count, search, and pagination.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Filter construction for Property Owners (role = OWNER)
    const whereCondition: any = {
      role: "OWNER",
    };

    if (search) {
      whereCondition.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") {
      whereCondition.isActive = true;
    } else if (status === "suspended") {
      whereCondition.isActive = false;
    }

    // Execute queries in parallel
    const [ownersList, totalCount, totalActive, totalSuspended, plans] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              ownedProperties: true,
            },
          },
          subscriptions: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: {
              plan: true,
            },
          },
        },
      }),
      prisma.user.count({ where: whereCondition }),
      prisma.user.count({ where: { role: "OWNER", isActive: true } }),
      prisma.user.count({ where: { role: "OWNER", isActive: false } }),
      prisma.saaSPlan.findMany({
        select: { id: true, name: true, priceMonthly: true, maxProperties: true, maxUnits: true },
        orderBy: { priceMonthly: "asc" },
      }),
    ]);

    const formattedOwners = ownersList.map((owner) => {
      const activeSub = owner.subscriptions[0] || null;
      return {
        id: owner.id,
        fullName: owner.fullName,
        email: owner.email,
        phoneNumber: owner.phoneNumber || "-",
        isActive: owner.isActive,
        propertyCount: owner._count.ownedProperties,
        currentPlan: activeSub ? activeSub.plan.name : "Free / Trial",
        planId: activeSub ? activeSub.plan.id : null,
        subscriptionStatus: activeSub ? activeSub.status : "TRIAL",
        subscriptionEndDate: activeSub ? activeSub.endDate : null,
        createdAt: owner.createdAt,
      };
    });

    return ApiResponse.success({
      message: "Berhasil mengambil data owner properti",
      data: {
        owners: formattedOwners,
        plans,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats: {
          totalOwners: totalActive + totalSuspended,
          activeOwners: totalActive,
          suspendedOwners: totalSuspended,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/owners error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil data owner properti",
      error,
      status: 500,
    });
  }
}

/**
 * POST /api/admin/owners
 * Handles: CREATE_OWNER, TOGGLE_SUSPEND, UPDATE_OWNER
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Create / Onboard New Property Owner
    if (action === "CREATE_OWNER") {
      const { fullName, email, phoneNumber, planId } = body;

      if (!fullName || !email) {
        return ApiResponse.error({
          message: "Nama lengkap dan email wajib diisi",
          status: 400,
        });
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return ApiResponse.error({
          message: "User dengan email ini sudah terdaftar",
          status: 400,
        });
      }

      // Get target plan or fallback to default plan
      let targetPlan = null;
      if (planId) {
        targetPlan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
      }
      if (!targetPlan) {
        targetPlan = await prisma.saaSPlan.findFirst({ orderBy: { priceMonthly: "asc" } });
      }

      // Create User with role = OWNER
      const newOwner = await prisma.user.create({
        data: {
          fullName,
          email,
          phoneNumber: phoneNumber || null,
          role: "OWNER",
          isActive: true,
        },
      });

      // Create initial subscription if plan exists
      if (targetPlan) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 Month Trial / Sub

        await prisma.ownerSubscription.create({
          data: {
            ownerId: newOwner.id,
            planId: targetPlan.id,
            status: "ACTIVE",
            startDate,
            endDate,
            autoRenew: true,
          },
        });
      }

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          userId: newOwner.id,
          action: "CREATE_PROPERTY_OWNER",
          entityName: "User",
          entityId: newOwner.id,
          details: { fullName, email, planAssigned: targetPlan?.name || "None" },
          ipAddress: "127.0.0.1",
        },
      });

      return ApiResponse.success({
        message: `Owner properti ${fullName} berhasil dibuat`,
        data: newOwner,
      });
    }

    // 2. Suspend / Unsuspend Owner Account
    if (action === "TOGGLE_SUSPEND") {
      const { ownerId, adminPassword } = body;
      if (!ownerId) {
        return ApiResponse.error({
          message: "ownerId wajib diisi",
          status: 400,
        });
      }

      if (!adminPassword || String(adminPassword).trim() === "") {
        return ApiResponse.error({
          message: "Password konfirmasi Platform Admin wajib diisi",
          status: 400,
        });
      }

      // 1. Fetch active Platform Admin email from Database
      const adminUser = await prisma.user.findFirst({
        where: { role: "PLATFORM_ADMIN", isActive: true },
      });

      const adminEmail = adminUser?.email || "admin@arventa.id";

      // 2. Verify password against Database Auth (Supabase Auth)
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword,
        });

        if (authError) {
          console.warn(`⚠️ Admin password verification failed for ${adminEmail}:`, authError.message);
          return ApiResponse.error({
            message: "Password konfirmasi salah. Silakan masukkan password akun Platform Admin Anda dengan benar.",
            status: 400,
          });
        }
      }

      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
      });

      if (!owner || owner.role !== "OWNER") {
        return ApiResponse.error({
          message: "Owner tidak ditemukan",
          status: 404,
        });
      }

      const updatedOwner = await prisma.user.update({
        where: { id: ownerId },
        data: { isActive: !owner.isActive },
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          userId: ownerId,
          action: updatedOwner.isActive ? "UNSUSPEND_OWNER_ACCOUNT" : "SUSPEND_OWNER_ACCOUNT",
          entityName: "User",
          entityId: ownerId,
          details: {
            ownerEmail: owner.email,
            isActive: updatedOwner.isActive,
            verifiedAdminEmail: adminEmail,
            verifiedWithPassword: true,
          },
          ipAddress: "127.0.0.1",
        },
      });

      return ApiResponse.success({
        message: `Status akun owner ${owner.fullName} berhasil diubah menjadi ${updatedOwner.isActive ? "AKTIF" : "DITANGGUHKAN (SUSPENDED)"}`,
        data: updatedOwner,
      });
    }

    // 3. Update Owner Profile Details
    if (action === "UPDATE_OWNER") {
      const { ownerId, fullName, phoneNumber, email } = body;
      if (!ownerId) {
        return ApiResponse.error({
          message: "ownerId wajib diisi",
          status: 400,
        });
      }

      const updatedOwner = await prisma.user.update({
        where: { id: ownerId },
        data: {
          fullName: fullName !== undefined ? fullName : undefined,
          phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
          email: email !== undefined ? email : undefined,
        },
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          userId: ownerId,
          action: "UPDATE_PROPERTY_OWNER_PROFILE",
          entityName: "User",
          entityId: ownerId,
          details: { fullName, email, phoneNumber },
          ipAddress: "127.0.0.1",
        },
      });

      return ApiResponse.success({
        message: `Profil owner ${updatedOwner.fullName} berhasil diperbarui`,
        data: updatedOwner,
      });
    }

    return ApiResponse.error({
      message: "Aksi tidak valid",
      status: 400,
    });
  } catch (error) {
    console.error("POST /api/admin/owners error:", error);
    return ApiResponse.error({
      message: "Terjadi kesalahan server",
      error,
      status: 500,
    });
  }
}

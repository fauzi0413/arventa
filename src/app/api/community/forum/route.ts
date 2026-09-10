import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import {
  parseForumPostRecord,
  serializeForumContent,
  ForumCategory,
  ForumStatus,
} from "@/lib/forum-helper";

/**
 * GET /api/community/forum
 * Retrieves forum posts with RBAC strict property scoping, search, category & status filters,
 * plus aggregate metrics for complaints and discussion monitoring.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const propertyIdFilter = searchParams.get("propertyId") || "ALL";
    const categoryFilter = searchParams.get("category") || "ALL";
    const statusFilter = searchParams.get("status") || "ALL";

    // 1. Determine accessible property IDs based on user role (Multi-tenant RBAC)
    let allowedPropertyIds: string[] = [];

    if (authUser.role === UserRole.PLATFORM_ADMIN) {
      // Platform admin can access all properties
      const allProps = await prisma.property.findMany({ select: { id: true } });
      allowedPropertyIds = allProps.map((p) => p.id);
    } else if (authUser.role === UserRole.OWNER) {
      const ownedProperties = await prisma.property.findMany({
        where: { ownerId: authUser.id },
        select: { id: true },
      });
      allowedPropertyIds = ownedProperties.map((p) => p.id);
    } else if (authUser.role === UserRole.HOUSEKEEPING) {
      const assignments = await prisma.housekeepingAssignment.findMany({
        where: { userId: authUser.id },
        select: { propertyId: true },
      });
      allowedPropertyIds = assignments.map((a) => a.propertyId);
    } else {
      // Tenant: find property from active lease
      const activeLease = await prisma.lease.findFirst({
        where: {
          status: "ACTIVE",
          OR: [
            { tenant: { userId: authUser.id } },
            { tenant: { email: authUser.email } },
            { unit: { unitUserId: authUser.id } },
          ],
        },
        select: { unit: { select: { propertyId: true } } },
      });
      if (activeLease?.unit?.propertyId) {
        allowedPropertyIds = [activeLease.unit.propertyId];
      }
    }

    // Strict Property Scoping: if user filters for a specific property, verify permission
    if (propertyIdFilter && propertyIdFilter !== "ALL") {
      if (!allowedPropertyIds.includes(propertyIdFilter) && authUser.role !== UserRole.PLATFORM_ADMIN) {
        return ApiResponse.forbidden("Anda tidak memiliki akses ke forum pada properti ini.");
      }
    }

    const targetPropertyIds =
      propertyIdFilter && propertyIdFilter !== "ALL"
        ? [propertyIdFilter]
        : allowedPropertyIds;

    // Fetch accessible properties for dropdown filter
    const assignedProperties = await prisma.property.findMany({
      where: { id: { in: allowedPropertyIds } },
      select: { id: true, name: true, address: true, city: true },
      orderBy: { name: "asc" },
    });

    if (targetPropertyIds.length === 0) {
      return ApiResponse.success({
        message: "Tidak ada data forum",
        data: {
          posts: [],
          assignedProperties: [],
          metrics: {
            totalPosts: 0,
            activeComplaintsCount: 0,
            resolvedComplaintsCount: 0,
            totalRepliesCount: 0,
          },
        },
      });
    }

    // Build Prisma query condition
    const whereConditions: any = {
      propertyId: { in: targetPropertyIds },
    };

    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { author: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // 2. Fetch raw posts with author and comments
    const rawPosts = await prisma.forumPost.findMany({
      where: whereConditions,
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        author: {
          select: { id: true, fullName: true, role: true, avatarUrl: true, email: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, fullName: true, role: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 3. Resolve tenant unit numbers for author badges (if author is a tenant in this property)
    const authorIds = Array.from(new Set(rawPosts.map((p) => p.authorId)));
    const activeLeases = await prisma.lease.findMany({
      where: {
        status: "ACTIVE",
        unit: { propertyId: { in: targetPropertyIds } },
        OR: [
          { tenant: { userId: { in: authorIds } } },
          { unit: { unitUserId: { in: authorIds } } },
        ],
      },
      select: {
        unit: { select: { unitNumber: true } },
        tenant: { select: { userId: true } },
      },
    });

    const unitMap = new Map<string, string>();
    activeLeases.forEach((l) => {
      if (l.tenant?.userId) {
        unitMap.set(l.tenant.userId, l.unit.unitNumber);
      }
    });

    // 4. Parse DTOs with metadata handling
    let parsedPosts = rawPosts.map((post) => parseForumPostRecord(post, unitMap));

    // Calculate aggregate metrics before post-filtering
    let activeComplaintsCount = 0;
    let resolvedComplaintsCount = 0;
    let totalRepliesCount = 0;

    parsedPosts.forEach((p) => {
      totalRepliesCount += p.commentsCount;
      if (p.category === "KELUHAN") {
        if (p.status === "RESOLVED") {
          resolvedComplaintsCount++;
        } else {
          activeComplaintsCount++;
        }
      }
    });

    // Apply category filter
    if (categoryFilter && categoryFilter !== "ALL") {
      parsedPosts = parsedPosts.filter((p) => p.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "ALL") {
      if (statusFilter === "RESOLVED") {
        parsedPosts = parsedPosts.filter((p) => p.status === "RESOLVED");
      } else if (statusFilter === "OPEN") {
        parsedPosts = parsedPosts.filter((p) => p.status !== "RESOLVED");
      }
    }

    return ApiResponse.success({
      message: "Daftar forum komunitas berhasil dimuat",
      data: {
        posts: parsedPosts,
        assignedProperties,
        metrics: {
          totalPosts: parsedPosts.length,
          activeComplaintsCount,
          resolvedComplaintsCount,
          totalRepliesCount,
        },
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/community/forum:", error);
    return ApiResponse.error({
      message: "Gagal memuat data forum komunitas",
      error: error?.message,
    });
  }
}

/**
 * POST /api/community/forum
 * Creates a new forum thread or broadcast topic in an assigned property.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    const body = await request.json().catch(() => ({}));
    const { title, content, propertyId, category = "DISKUSI" } = body;

    if (!title || !title.trim()) {
      return ApiResponse.badRequest("Judul topik diskusi wajib diisi");
    }
    if (!content || !content.trim()) {
      return ApiResponse.badRequest("Isi konten diskusi wajib diisi");
    }
    if (!propertyId) {
      return ApiResponse.badRequest("ID Properti tujuan wajib dipilih");
    }

    // Verify property access rights (Strict Property Scoping)
    if (authUser.role === UserRole.HOUSEKEEPING) {
      const assignment = await prisma.housekeepingAssignment.findFirst({
        where: { userId: authUser.id, propertyId },
      });
      if (!assignment) {
        return ApiResponse.forbidden("Anda tidak ditugaskan pada properti ini.");
      }
    } else if (authUser.role === UserRole.OWNER) {
      const property = await prisma.property.findFirst({
        where: { id: propertyId, ownerId: authUser.id },
      });
      if (!property) {
        return ApiResponse.forbidden("Anda bukan pemilik properti ini.");
      }
    } else if (authUser.role !== UserRole.PLATFORM_ADMIN) {
      // Tenant check
      const activeLease = await prisma.lease.findFirst({
        where: {
          status: "ACTIVE",
          unit: { propertyId },
          OR: [
            { tenant: { userId: authUser.id } },
            { tenant: { email: authUser.email } },
            { unit: { unitUserId: authUser.id } },
          ],
        },
      });
      if (!activeLease) {
        return ApiResponse.forbidden("Anda tidak memiliki sewa aktif pada properti ini.");
      }
    }

    const serializedContent = serializeForumContent({
      content: content.trim(),
      category: category as ForumCategory,
      status: "OPEN",
    });

    const newPost = await prisma.forumPost.create({
      data: {
        propertyId,
        authorId: authUser.id,
        title: title.trim(),
        content: serializedContent,
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
        comments: true,
      },
    });

    const postDTO = parseForumPostRecord(newPost);

    return ApiResponse.success({
      message: "Topik diskusi berhasil dibuat",
      data: postDTO,
      status: 201,
    });
  } catch (error: any) {
    console.error("Error in POST /api/community/forum:", error);
    return ApiResponse.error({
      message: "Gagal membuat topik diskusi",
      error: error?.message,
    });
  }
}

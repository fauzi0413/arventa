import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { parseAnnouncementRecord, serializeAnnouncementContent } from "@/lib/announcement-helper";
import { AnnouncementFormData, AnnouncementStatus, TargetScope } from "@/app/(dashboard)/community/announcements/types";

/**
 * GET /api/announcements
 * Retrieve filtered and scoped announcements list with RBAC & Tenant Isolation.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const statusFilter = searchParams.get("status") as AnnouncementStatus | "ALL" | null;
    const propertyIdFilter = searchParams.get("propertyId") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));

    // 1. Determine property scope based on user role
    let allowedPropertyIds: string[] = [];
    let tenantUnitId: string | null = null;
    const isTenant = authUser.role === UserRole.TENANT || authUser.role === UserRole.USER;

    if (authUser.role === UserRole.PLATFORM_ADMIN) {
      // Platform admin can access all
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
    } else if (isTenant) {
      // Tenant: find active lease unit
      const activeLease = await prisma.lease.findFirst({
        where: {
          status: "ACTIVE",
          OR: [
            { tenant: { userId: authUser.id } },
            { tenant: { email: authUser.email } },
            { unit: { unitUserId: authUser.id } },
          ],
        },
        select: {
          unitId: true,
          unit: {
            select: { propertyId: true },
          },
        },
      });

      if (activeLease) {
        allowedPropertyIds = [activeLease.unit.propertyId];
        tenantUnitId = activeLease.unitId;
      } else {
        allowedPropertyIds = ["__NO_PROPERTIES__"];
      }
    }

    // Build Prisma query condition
    const whereConditions: any = {};

    // RBAC Property filtering
    if (authUser.role !== UserRole.PLATFORM_ADMIN) {
      whereConditions.propertyId = { in: allowedPropertyIds };
    }

    // Explicit property filter from query param
    if (propertyIdFilter && propertyIdFilter !== "ALL") {
      if (allowedPropertyIds.length > 0 && !allowedPropertyIds.includes(propertyIdFilter) && authUser.role !== UserRole.PLATFORM_ADMIN) {
        return ApiResponse.forbidden("Anda tidak memiliki akses ke pengumuman pada properti ini.");
      }
      whereConditions.propertyId = propertyIdFilter;
    }

    // Search query on title
    if (search) {
      whereConditions.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Date range filter on createdAt
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) {
        whereConditions.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereConditions.createdAt.lte = end;
      }
    }

    // Fetch announcements with relations
    const rawAnnouncements = await prisma.announcement.findMany({
      where: whereConditions,
      include: {
        property: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch all relevant units to build mapping for targetUnitNumbers
    const allUnitIdsToResolve = new Set<string>();
    for (const ann of rawAnnouncements) {
      if (ann.content?.includes("targetUnitIds")) {
        try {
          const match = ann.content.match(/<!--ARVENTA_ANNOUNCEMENT_META:(.*?)-->/);
          if (match && match[1]) {
            const parsed = JSON.parse(match[1]);
            if (Array.isArray(parsed.targetUnitIds)) {
              parsed.targetUnitIds.forEach((id: string) => allUnitIdsToResolve.add(id));
            }
          }
        } catch {}
      }
    }

    const unitNumbersMap = new Map<string, string>();
    if (allUnitIdsToResolve.size > 0) {
      const units = await prisma.unit.findMany({
        where: { id: { in: Array.from(allUnitIdsToResolve) } },
        select: { id: true, unitNumber: true },
      });
      units.forEach((u) => unitNumbersMap.set(u.id, u.unitNumber));
    }

    // Parse records into typed AnnouncementItem
    let parsedItems = rawAnnouncements.map((rec) =>
      parseAnnouncementRecord(rec, undefined, unitNumbersMap)
    );

    // Apply Tenant Isolation Filtering (Post-processing)
    if (isTenant) {
      // Tenant can ONLY see PUBLISHED announcements whose publishDate is <= now
      const now = new Date();
      parsedItems = parsedItems.filter((item) => {
        if (item.status !== "PUBLISHED") return false;
        const pubDate = new Date(item.publishDate);
        if (!isNaN(pubDate.getTime()) && pubDate > now) return false;

        // If scoped to specific units, tenant's unit must be included
        if (item.targetScope === "SPECIFIC_UNITS" && item.targetUnitIds && item.targetUnitIds.length > 0) {
          if (!tenantUnitId || !item.targetUnitIds.includes(tenantUnitId)) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply status filter if specified
    if (statusFilter && statusFilter !== "ALL") {
      parsedItems = parsedItems.filter((item) => item.status === statusFilter);
    }

    // Pagination
    const total = parsedItems.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = parsedItems.slice(startIndex, startIndex + limit);

    return ApiResponse.success({
      message: "Daftar pengumuman berhasil dimuat",
      data: paginatedItems,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        userRole: authUser.role,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/announcements:", error);
    return ApiResponse.error({
      message: "Gagal memuat daftar pengumuman",
      error: error?.message,
    });
  }
}

/**
 * POST /api/announcements
 * Create a new announcement with RBAC enforcement and status scheduling.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    // Only OWNER, HOUSEKEEPING, or PLATFORM_ADMIN can create announcements
    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.HOUSEKEEPING && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Anda tidak memiliki izin untuk membuat pengumuman.");
    }

    const body: AnnouncementFormData = await request.json();

    // Validation: Title
    if (!body.title || body.title.trim().length === 0) {
      return ApiResponse.badRequest("Judul pengumuman wajib diisi.");
    }
    if (body.title.length > 120) {
      return ApiResponse.badRequest("Judul pengumuman maksimal 120 karakter.");
    }

    // Validation: Content
    if (!body.content || body.content.trim().length === 0) {
      return ApiResponse.badRequest("Isi pengumuman wajib diisi.");
    }

    const targetScope: TargetScope = body.targetScope || "SPECIFIC_PROPERTY";
    let targetPropertyId = body.targetPropertyId;

    // RBAC & Scope Access Control
    if (authUser.role === UserRole.HOUSEKEEPING) {
      // Housekeeping CANNOT broadcast to ALL_PROPERTIES
      if (targetScope === "ALL_PROPERTIES") {
        return ApiResponse.forbidden("Staf housekeeping tidak memiliki wewenang untuk broadcast ke seluruh properti.");
      }

      if (!targetPropertyId) {
        return ApiResponse.badRequest("Properti target wajib dipilih untuk staf housekeeping.");
      }

      // Check that targetPropertyId is assigned to this housekeeping user
      const isAssigned = await prisma.housekeepingAssignment.findFirst({
        where: {
          userId: authUser.id,
          propertyId: targetPropertyId,
        },
      });

      if (!isAssigned) {
        return ApiResponse.forbidden("Staf housekeeping hanya dapat membuat pengumuman untuk properti tempat mereka ditugaskan.");
      }
    } else if (authUser.role === UserRole.OWNER) {
      if (targetScope === "ALL_PROPERTIES") {
        // Find owner's first property to fulfill Prisma's required foreign key
        const ownerFirstProp = await prisma.property.findFirst({
          where: { ownerId: authUser.id },
          select: { id: true },
        });

        if (!ownerFirstProp) {
          return ApiResponse.badRequest("Anda belum memiliki properti terdaftar untuk menerbitkan pengumuman.");
        }
        targetPropertyId = ownerFirstProp.id;
      } else {
        if (!targetPropertyId) {
          return ApiResponse.badRequest("Properti target wajib dipilih.");
        }
        // Verify owner owns this property
        const owns = await prisma.property.findFirst({
          where: { id: targetPropertyId, ownerId: authUser.id },
        });
        if (!owns) {
          return ApiResponse.forbidden("Anda tidak memiliki akses ke properti yang dipilih.");
        }
      }
    } else if (authUser.role === UserRole.PLATFORM_ADMIN) {
      if (!targetPropertyId) {
        const firstProp = await prisma.property.findFirst({ select: { id: true } });
        if (!firstProp) {
          return ApiResponse.badRequest("Belum ada properti terdaftar di sistem.");
        }
        targetPropertyId = firstProp.id;
      }
    }

    // Determine initial status
    const publishDateStr = body.publishDate ? new Date(body.publishDate).toISOString() : new Date().toISOString();
    const pubDate = new Date(publishDateStr);
    const now = new Date();

    let initialStatus: AnnouncementStatus;
    if (body.isDraft) {
      initialStatus = "DRAFT";
    } else if (pubDate > now) {
      initialStatus = "SCHEDULED";
    } else {
      initialStatus = "PUBLISHED";
    }

    // Validate specific units if targetScope === 'SPECIFIC_UNITS'
    let unitIds = body.targetUnitIds;
    if (targetScope === "SPECIFIC_UNITS") {
      if (!unitIds || unitIds.length === 0) {
        return ApiResponse.badRequest("Pilih setidaknya satu kamar untuk target kamar tertentu.");
      }
    } else {
      unitIds = [];
    }

    // Serialize metadata into content
    const serializedContent = serializeAnnouncementContent({
      content: body.content.trim(),
      status: initialStatus,
      targetScope,
      targetUnitIds: unitIds,
      publishDate: publishDateStr,
    });

    // Create record in Prisma database
    const created = await prisma.announcement.create({
      data: {
        propertyId: targetPropertyId!,
        createdById: authUser.id,
        title: body.title.trim(),
        content: serializedContent,
        isPinned: false,
      },
      include: {
        property: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    const parsedItem = parseAnnouncementRecord(created);

    return ApiResponse.success({
      status: 201,
      message:
        initialStatus === "DRAFT"
          ? "Pengumuman berhasil disimpan sebagai draf"
          : initialStatus === "SCHEDULED"
          ? "Pengumuman berhasil dijadwalkan"
          : "Pengumuman berhasil dipublikasikan",
      data: parsedItem,
    });
  } catch (error: any) {
    console.error("Error in POST /api/announcements:", error);
    return ApiResponse.error({
      message: "Gagal membuat pengumuman",
      error: error?.message,
    });
  }
}

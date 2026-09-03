import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { parseAnnouncementRecord } from "@/lib/announcement-helper";
import { TenantAnnouncement } from "@/app/(dashboard)/tenant/community-announcements/types";

/**
 * GET /api/tenant/announcements
 * Retrieve tenant-scoped announcements with strict data isolation.
 *
 * Capabilities & Security Rules:
 * 1. Strict Tenant Isolation: Only announcements matching:
 *    - targetScope === 'ALL_PROPERTIES'
 *    - targetScope === 'SPECIFIC_PROPERTY' AND propertyId === tenant.propertyId
 *    - targetScope === 'SPECIFIC_UNITS' AND tenant.unitId in targetUnitIds
 * 2. Status Gating: Only PUBLISHED announcements where publishDate <= now().
 *    Blocks DRAFT, ARCHIVED, and future SCHEDULED.
 * 3. Tab Filter:
 *    - 'LATEST': publishDate >= 30 days ago
 *    - 'HISTORY': publishDate < 30 days ago
 * 4. Read-only: No mutations allowed for tenants.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    const { searchParams } = new URL(request.url);
    const rawTab = searchParams.get("tab") || "ACTIVE";
    const tab = (rawTab === "LATEST" || rawTab === "ACTIVE") ? "ACTIVE" : "HISTORY";
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    // 1. Locate tenant's lease, unit, and property
    let tenantPropertyId: string | undefined;
    let tenantUnitId: string | undefined;
    let tenantPropertyName: string = "Properti Anda";
    let tenantUnitNumber: string = "";
    let propertyOwnerId: string | undefined;

    // Check direct unit assignment (Unit Account login)
    const directUnit = await prisma.unit.findFirst({
      where: { unitUserId: authUser.id },
      include: {
        property: {
          select: { id: true, name: true, ownerId: true },
        },
      },
    });

    if (directUnit) {
      tenantPropertyId = directUnit.propertyId;
      tenantUnitId = directUnit.id;
      tenantPropertyName = directUnit.property.name;
      tenantUnitNumber = directUnit.unitNumber;
      propertyOwnerId = directUnit.property.ownerId;
    } else {
      // Check active or recent lease
      const lease = await prisma.lease.findFirst({
        where: {
          OR: [
            { tenant: { userId: authUser.id } },
            { tenant: { email: authUser.email } },
            { unit: { unitUserId: authUser.id } },
          ],
        },
        include: {
          unit: {
            include: {
              property: {
                select: { id: true, name: true, ownerId: true },
              },
            },
          },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      });

      if (lease) {
        tenantPropertyId = lease.unit.propertyId;
        tenantUnitId = lease.unitId;
        tenantPropertyName = lease.unit.property.name;
        tenantUnitNumber = lease.unit.unitNumber;
        propertyOwnerId = lease.unit.property.ownerId;
      }
    }

    // 2. Query candidate announcements
    // Candidate pool: Announcements in tenant's property OR broadcast (ALL_PROPERTIES)
    const rawAnnouncements = await prisma.announcement.findMany({
      where: tenantPropertyId
        ? {
            OR: [
              { propertyId: tenantPropertyId },
              // Include announcements from same owner (which could be ALL_PROPERTIES broadcasts)
              ...(propertyOwnerId
                ? [{ property: { ownerId: propertyOwnerId } }]
                : []),
            ],
          }
        : {},
      include: {
        property: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Resolve unit numbers if needed for metadata
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

    // 4. Parse records into strongly typed objects
    const parsedAnnouncements = rawAnnouncements.map((rec) =>
      parseAnnouncementRecord(rec, undefined, unitNumbersMap)
    );

    // 5. Strict Visibility & Tenant Isolation Gating
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const isolatedItems: TenantAnnouncement[] = [];

    for (const item of parsedAnnouncements) {
      // Rule 1: Status must be PUBLISHED
      if (item.status !== "PUBLISHED") continue;

      // Rule 2: Time Gating - publishDate must be <= now
      const pubDate = new Date(item.publishDate);
      if (isNaN(pubDate.getTime()) || pubDate > now) continue;

      // Rule 3: Tenant Scoping Isolation
      let isScopedToTenant = false;
      let scopeLabel = "Semua Penghuni Properti";

      if (item.targetScope === "ALL_PROPERTIES") {
        isScopedToTenant = true;
        scopeLabel = "Semua Penghuni Properti";
      } else if (item.targetScope === "SPECIFIC_PROPERTY") {
        if (tenantPropertyId && item.targetPropertyId === tenantPropertyId) {
          isScopedToTenant = true;
          scopeLabel = "Semua Penghuni Properti";
        }
      } else if (item.targetScope === "SPECIFIC_UNITS") {
        if (tenantUnitId && item.targetUnitIds?.includes(tenantUnitId)) {
          isScopedToTenant = true;
          scopeLabel = tenantUnitNumber
            ? `Khusus Kamar Anda (${tenantUnitNumber})`
            : "Khusus Lantai/Kamar Anda";
        }
      }

      // If not scoped to tenant, do NOT expose
      if (!isScopedToTenant) continue;

      // Rule 4: Priority determination
      const isImportant =
        item.title.toLowerCase().includes("penting") ||
        item.title.toLowerCase().includes("urgent") ||
        item.content.toLowerCase().includes("[penting]");

      // Sender Role mapping ('OWNER' | 'HOUSEKEEPING')
      const senderRole: "OWNER" | "HOUSEKEEPING" =
        item.createdBy?.role === "HOUSEKEEPING" ? "HOUSEKEEPING" : "OWNER";

      const tenantAnn = {
        id: item.id,
        title: item.title,
        content: item.content,
        senderName: item.createdBy?.name || (senderRole === "OWNER" ? "Pengelola Kost" : "Staf Housekeeping"),
        senderRole,
        publishDate: item.publishDate,
        isRead: false, // Enriched on client with localStorage read status
        priority: (isImportant ? "IMPORTANT" : "NORMAL") as "IMPORTANT" | "NORMAL",
        isImportant,
        targetScopeLabel: scopeLabel,
        propertyInfo: {
          propertyName: item.targetPropertyName || tenantPropertyName,
          scopeLabel,
        },
      };

      // Rule 5: Tab Gating (ACTIVE <= 30 days, HISTORY > 30 days)
      const isLatest = pubDate >= thirtyDaysAgo;
      if (tab === "ACTIVE" && !isLatest) continue;
      if (tab === "HISTORY" && isLatest) continue;

      // Rule 6: Search Filter (if provided)
      if (search) {
        const matchesTitle = tenantAnn.title.toLowerCase().includes(search);
        const matchesContent = tenantAnn.content.toLowerCase().includes(search);
        const matchesSender = tenantAnn.senderName.toLowerCase().includes(search);
        if (!matchesTitle && !matchesContent && !matchesSender) continue;
      }

      isolatedItems.push(tenantAnn);
    }

    // Sort descending by publishDate
    isolatedItems.sort(
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );

    return ApiResponse.success({
      message: "Pengumuman penyewa berhasil dimuat",
      data: isolatedItems,
      meta: {
        tab,
        total: isolatedItems.length,
        tenantProperty: tenantPropertyName,
        tenantUnit: tenantUnitNumber,
        syncedAt: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("GET /api/tenant/announcements error:", error);
    return ApiResponse.error({
      message: "Gagal memuat pengumuman penyewa",
      error: error?.message || error,
      status: 500,
    });
  }
}

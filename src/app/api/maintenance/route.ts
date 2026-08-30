import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { prisma } from "@/lib/prisma";
import { UserRole, MaintenanceType, MaintenanceStatus, ReportPriority, CostLiability, UnitStatus } from "@/generated/prisma/client";

/**
 * GET /api/maintenance
 * Fetch list of maintenance tickets & housekeeping reports with granular role-scoping.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi pengguna tidak valid atau telah berakhir");
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");
    const unitIdParam = searchParams.get("unitId");
    const typeParam = searchParams.get("type"); // ALL, HOUSEKEEPING, REPAIR
    const statusParam = searchParams.get("status"); // ALL, REPORTED, IN_PROGRESS, RESOLVED, CANCELLED
    const priorityParam = searchParams.get("priority");
    const searchParam = searchParams.get("search")?.toLowerCase().trim() || "";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // 1. Determine accessible property IDs based on role
    let accessiblePropertyIds: string[] = [];

    if (authUser.role === UserRole.HOUSEKEEPING) {
      const assignments = await prisma.housekeepingAssignment.findMany({
        where: { userId: authUser.id },
        select: { propertyId: true },
      });
      accessiblePropertyIds = assignments.map((a) => a.propertyId);
    } else if (authUser.role === UserRole.OWNER) {
      const ownerProps = await prisma.property.findMany({
        where: { ownerId: authUser.id },
        select: { id: true },
      });
      accessiblePropertyIds = ownerProps.map((p) => p.id);
    } else if (authUser.role === UserRole.PLATFORM_ADMIN) {
      const allProps = await prisma.property.findMany({
        select: { id: true },
      });
      accessiblePropertyIds = allProps.map((p) => p.id);
    } else {
      // Tenant / User: Find properties of their active leases or room account
      const tenantLeases = await prisma.lease.findMany({
        where: {
          tenant: { userId: authUser.id },
          status: "ACTIVE",
        },
        include: { unit: true },
      });
      accessiblePropertyIds = tenantLeases.map((l) => l.unit.propertyId);
      if (authUser.unitAccountId) {
        const unit = await prisma.unit.findUnique({ where: { id: authUser.unitAccountId } });
        if (unit) accessiblePropertyIds.push(unit.propertyId);
      }
    }

    // Filter by specific property if selected
    let targetPropertyIds = accessiblePropertyIds;
    if (propertyIdParam && propertyIdParam !== "all" && propertyIdParam !== "ALL") {
      targetPropertyIds = accessiblePropertyIds.filter((id) => id === propertyIdParam);
    }

    if (targetPropertyIds.length === 0) {
      return ApiResponse.success({
        message: "Data laporan maintenance & housekeeping berhasil dimuat",
        data: {
          items: [],
          housekeepingList: [],
          maintenanceList: [],
          metrics: {
            totalHousekeeping: 0,
            totalMaintenance: 0,
            pendingCount: 0,
            inProgressCount: 0,
            resolvedCount: 0,
            averageRating: 0,
          },
        },
      });
    }

    // Build Where query
    const whereClause: any = {
      propertyId: { in: targetPropertyIds },
    };

    if (unitIdParam && unitIdParam !== "all") {
      whereClause.unitId = unitIdParam;
    }

    if (typeParam && typeParam !== "ALL") {
      whereClause.type = typeParam as MaintenanceType;
    }

    if (statusParam && statusParam !== "ALL") {
      // Map UI statuses to DB statuses if needed
      const statusMap: Record<string, MaintenanceStatus> = {
        REQUESTED: MaintenanceStatus.REPORTED,
        REPORTED: MaintenanceStatus.REPORTED,
        IN_CLEANING: MaintenanceStatus.IN_PROGRESS,
        IN_PROGRESS: MaintenanceStatus.IN_PROGRESS,
        INSPECTION: MaintenanceStatus.IN_PROGRESS,
        AWAITING_APPROVAL: MaintenanceStatus.IN_PROGRESS,
        COMPLETED: MaintenanceStatus.RESOLVED,
        RESOLVED: MaintenanceStatus.RESOLVED,
        CLOSED: MaintenanceStatus.RESOLVED,
        CANCELLED: MaintenanceStatus.CANCELLED,
      };
      whereClause.status = statusMap[statusParam] || (statusParam as MaintenanceStatus);
    }

    if (priorityParam && priorityParam !== "ALL") {
      whereClause.priority = priorityParam as ReportPriority;
    }

    if (startDateParam || endDateParam) {
      whereClause.createdAt = {};
      if (startDateParam) {
        whereClause.createdAt.gte = new Date(startDateParam);
      }
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    // Fetch tickets with relations
    const rawTickets = await prisma.maintenanceTicket.findMany({
      where: whereClause,
      include: {
        property: { select: { id: true, name: true, address: true, city: true } },
        unit: { select: { id: true, unitNumber: true, status: true } },
        reportedBy: { select: { id: true, fullName: true, role: true, email: true, phoneNumber: true } },
        assignedStaff: { select: { id: true, fullName: true, role: true, email: true, phoneNumber: true } },
        timelines: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform into frontend standard shapes
    const housekeepingList: any[] = [];
    const maintenanceList: any[] = [];

    rawTickets.forEach((t) => {
      // Convert timelines
      const formattedTimeline = t.timelines.map((tl) => ({
        id: tl.id,
        reportId: t.id,
        timestamp: new Date(tl.createdAt).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: tl.status,
        performerName: tl.performerName,
        performerRole: tl.performerRole,
        notes: tl.notes || "-",
        attachmentUrl: tl.attachmentUrl || undefined,
      }));

      // Format rating
      const ratingData = t.ratingScore
        ? {
            score: t.ratingScore,
            feedback: t.ratingFeedback || "",
            ratedAt: t.ratedAt
              ? new Date(t.ratedAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "",
            ratedBy: {
              id: "rated-by-user",
              name: t.ratedByName || "Penyewa / Owner",
            },
          }
        : null;

      if (t.type === MaintenanceType.HOUSEKEEPING) {
        // Map DB Status to Housekeeping Status
        const hkStatusMap: Record<MaintenanceStatus, string> = {
          REPORTED: "REQUESTED",
          IN_PROGRESS: "IN_CLEANING",
          WAITING_PARTS: "IN_CLEANING",
          RESOLVED: "COMPLETED",
          CANCELLED: "CLOSED",
        };

        const hkItem = {
          id: t.id,
          ticketNumber: t.ticketNumber,
          propertyId: t.propertyId,
          propertyName: t.property.name,
          unitId: t.unitId || "",
          unitNumber: t.unit?.unitNumber || "Area Umum",
          serviceType: t.serviceType || "DAILY_CLEAN",
          status: hkStatusMap[t.status] || "REQUESTED",
          reportedBy: {
            id: t.reportedById || "usr-anon",
            name: t.reportedByName || t.reportedBy?.fullName || "SOP Rutin",
            role: (t.reportedByRole as any) || (t.reportedBy?.role as any) || "STAFF",
            phone: t.reportedBy?.phoneNumber || undefined,
          },
          housekeeper: {
            id: t.assignedStaffId || "stf-hk",
            name: t.assignedStaffName || t.assignedStaff?.fullName || "Staf Housekeeping",
            role: "STAFF" as const,
            phone: t.assignedStaff?.phoneNumber || undefined,
          },
          checklist: (t.checklist as any) || {
            bathroom: false,
            bedLinen: false,
            floorSweptMopped: false,
            trashEmptied: false,
          },
          notes: t.description || "",
          resolutionNotes: t.resolutionNotes || "",
          photos: {
            before: t.photosBefore || [],
            after: t.photosAfter || [],
          },
          rating: ratingData,
          timeline: formattedTimeline,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        };

        housekeepingList.push(hkItem);
      } else {
        // Maintenance Repair
        const mntItem = {
          id: t.id,
          ticketNumber: t.ticketNumber,
          propertyId: t.propertyId,
          propertyName: t.property.name,
          unitId: t.unitId || "",
          unitNumber: t.unit?.unitNumber || "Area Umum",
          title: t.title,
          description: t.description || "",
          priority: t.priority,
          status: t.status,
          reportedBy: {
            id: t.reportedById || "usr-anon",
            name: t.reportedByName || t.reportedBy?.fullName || "Penghuni",
            role: (t.reportedByRole as any) || (t.reportedBy?.role as any) || "TENANT",
            phone: t.reportedBy?.phoneNumber || undefined,
          },
          assignedStaff: {
            id: t.assignedStaffId || "stf-tech",
            name: t.assignedStaffName || t.assignedStaff?.fullName || "Teknisi",
            role: "STAFF" as const,
            phone: t.assignedStaff?.phoneNumber || undefined,
          },
          costLiability: t.costLiability || "OWNER",
          estimatedCost: t.estimatedCost ? Number(t.estimatedCost) : undefined,
          actualCost: t.actualCost ? Number(t.actualCost) : undefined,
          damageAnalysis: t.damageAnalysis || undefined,
          vendorName: t.vendorName || undefined,
          resolutionNotes: t.resolutionNotes || "",
          photos: {
            before: t.photosBefore || [],
            after: t.photosAfter || [],
          },
          rating: ratingData,
          timeline: formattedTimeline,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        };

        maintenanceList.push(mntItem);
      }
    });

    // Apply Search Filter in Memory if text query provided
    let filteredHK = housekeepingList;
    let filteredMNT = maintenanceList;

    if (searchParam) {
      filteredHK = filteredHK.filter(
        (h) =>
          h.ticketNumber.toLowerCase().includes(searchParam) ||
          h.propertyName.toLowerCase().includes(searchParam) ||
          h.unitNumber.toLowerCase().includes(searchParam) ||
          h.serviceType.toLowerCase().includes(searchParam) ||
          h.notes.toLowerCase().includes(searchParam) ||
          h.housekeeper.name.toLowerCase().includes(searchParam)
      );

      filteredMNT = filteredMNT.filter(
        (m) =>
          m.ticketNumber.toLowerCase().includes(searchParam) ||
          m.propertyName.toLowerCase().includes(searchParam) ||
          m.unitNumber.toLowerCase().includes(searchParam) ||
          m.title.toLowerCase().includes(searchParam) ||
          m.description.toLowerCase().includes(searchParam) ||
          m.assignedStaff.name.toLowerCase().includes(searchParam)
      );
    }

    // Calculate aggregated metrics
    const allItems = [...filteredHK, ...filteredMNT];
    const ratedItems = allItems.filter((i) => i.rating && i.rating.score > 0);
    const avgRating =
      ratedItems.length > 0
        ? Number((ratedItems.reduce((acc, i) => acc + i.rating.score, 0) / ratedItems.length).toFixed(1))
        : 5.0;

    const metrics = {
      totalHousekeeping: filteredHK.length,
      totalMaintenance: filteredMNT.length,
      pendingCount: allItems.filter((i) => i.status === "REQUESTED" || i.status === "REPORTED").length,
      inProgressCount: allItems.filter((i) => i.status === "IN_CLEANING" || i.status === "IN_PROGRESS").length,
      resolvedCount: allItems.filter((i) => i.status === "COMPLETED" || i.status === "RESOLVED").length,
      averageRating: avgRating,
    };

    return ApiResponse.success({
      message: "Data laporan maintenance & housekeeping berhasil dimuat",
      data: {
        housekeepingList: filteredHK,
        maintenanceList: filteredMNT,
        allHistory: allItems,
        metrics,
      },
    });
  } catch (error: any) {
    console.error("GET /api/maintenance error:", error);
    return ApiResponse.error({
      message: "Gagal memuat data laporan maintenance & housekeeping",
      error: error?.message || error,
      status: 500,
    });
  }
}

/**
 * POST /api/maintenance
 * Create new maintenance report / housekeeping task with initial timeline entry.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi pengguna tidak valid atau telah berakhir");
    }

    const body = await request.json();
    const {
      propertyId,
      unitId,
      type = "REPAIR", // HOUSEKEEPING or REPAIR
      serviceType,
      title,
      description,
      priority = "MEDIUM",
      photosBefore = [],
      estimatedCost,
      costLiability = "OWNER",
      damageAnalysis,
      checklist,
    } = body;

    if (!propertyId) {
      return ApiResponse.badRequest("propertyId wajib diisi");
    }

    if (!title && type !== "HOUSEKEEPING") {
      return ApiResponse.badRequest("Judul perbaikan wajib diisi");
    }

    const isHK = type === "HOUSEKEEPING" || type === MaintenanceType.HOUSEKEEPING;
    const ticketPrefix = isHK ? "HK" : "MNT";
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `${ticketPrefix}-${year}-${randomSuffix}`;

    const formattedTitle = title || (serviceType ? `Layanan Kebersihan: ${serviceType.replace(/_/g, " ")}` : "Tugas Kebersihan");

    // Assign PIC defaults
    let assignedStaffId: string | null = null;
    let assignedStaffName: string | null = null;

    if (authUser.role === UserRole.HOUSEKEEPING) {
      assignedStaffId = authUser.id;
      assignedStaffName = authUser.fullName;
    }

    // Role restrictions on financial fields: Housekeeping cannot set costLiability
    const safeCostLiability = authUser.role === UserRole.OWNER || authUser.role === UserRole.PLATFORM_ADMIN
      ? (costLiability as CostLiability)
      : CostLiability.OWNER;

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceTicket.create({
        data: {
          ticketNumber,
          propertyId,
          unitId: unitId || null,
          type: isHK ? MaintenanceType.HOUSEKEEPING : MaintenanceType.REPAIR,
          serviceType: serviceType || (isHK ? "DAILY_CLEAN" : "OTHER_REPAIR"),
          title: formattedTitle,
          description: description || null,
          priority: (priority as ReportPriority) || ReportPriority.MEDIUM,
          status: MaintenanceStatus.REPORTED,
          reportedById: authUser.id,
          reportedByName: authUser.fullName,
          reportedByRole: authUser.role,
          assignedStaffId,
          assignedStaffName,
          costLiability: safeCostLiability,
          estimatedCost: estimatedCost ? Number(estimatedCost) : null,
          damageAnalysis: damageAnalysis || null,
          photosBefore: Array.isArray(photosBefore) ? photosBefore : [],
          checklist: checklist || null,
        },
      });

      // Create initial timeline entry
      await tx.maintenanceTimeline.create({
        data: {
          ticketId: created.id,
          status: "REPORTED",
          performerId: authUser.id,
          performerName: authUser.fullName,
          performerRole: authUser.role,
          notes: isHK
            ? `Panggilan/Jadwal kebersihan dibuat oleh ${authUser.fullName}.`
            : `Laporan kerusakan diajukan: "${formattedTitle}".`,
        },
      });

      // If unit specified and high priority repair, update unit status to MAINTENANCE
      if (unitId && !isHK && (priority === "HIGH" || priority === "EMERGENCY")) {
        await tx.unit.update({
          where: { id: unitId },
          data: { status: UnitStatus.MAINTENANCE },
        });

        await tx.unitStatusLog.create({
          data: {
            unitId,
            changedById: authUser.id,
            previousStatus: UnitStatus.AVAILABLE,
            newStatus: UnitStatus.MAINTENANCE,
            notes: `Otomatis status dialihkan ke Perbaikan (Maintenance) oleh tiket ${ticketNumber}`,
          },
        });
      }

      return created;
    });

    return ApiResponse.success({
      message: "Laporan berhasil dibuat dan tersimpan di database",
      data: ticket,
    });
  } catch (error: any) {
    console.error("POST /api/maintenance error:", error);
    return ApiResponse.error({
      message: "Gagal membuat laporan maintenance / housekeeping",
      error: error?.message || error,
      status: 500,
    });
  }
}

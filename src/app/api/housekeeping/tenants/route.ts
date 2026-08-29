import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/roles";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi pengguna tidak valid atau telah berakhir");
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const propertyIdFilter = searchParams.get("propertyId") || undefined;

    // 1. Determine accessible property IDs based on role
    let assignedPropertyIds: string[] = [];

    if (authUser.role === UserRole.HOUSEKEEPING) {
      const assignments = await prisma.housekeepingAssignment.findMany({
        where: { userId: authUser.id },
        select: { propertyId: true },
      });
      assignedPropertyIds = assignments.map((a) => a.propertyId);
    } else if (authUser.role === UserRole.OWNER) {
      const ownerProps = await prisma.property.findMany({
        where: { ownerId: authUser.id },
        select: { id: true },
      });
      assignedPropertyIds = ownerProps.map((p) => p.id);
    } else {
      // PLATFORM_ADMIN or fallback: all properties
      const allProps = await prisma.property.findMany({
        select: { id: true },
      });
      assignedPropertyIds = allProps.map((p) => p.id);
    }

    // Filter by specific property if selected by user
    let targetPropertyIds = assignedPropertyIds;
    if (propertyIdFilter && propertyIdFilter !== "all") {
      targetPropertyIds = assignedPropertyIds.filter((id) => id === propertyIdFilter);
    }

    // Fetch assigned properties list metadata for dropdown filter
    const assignedPropertiesList = await prisma.property.findMany({
      where: { id: { in: assignedPropertyIds } },
      select: { id: true, name: true, address: true, city: true },
      orderBy: { name: "asc" },
    });

    if (targetPropertyIds.length === 0) {
      return ApiResponse.success({
        message: "Data penghuni lapangan berhasil diambil",
        data: {
          tenants: [],
          assignedProperties: assignedPropertiesList,
          meta: { totalTenants: 0, activeCount: 0 },
        },
      });
    }

    // 2. Query Active Leases & Units in assigned properties
    const leases = await prisma.lease.findMany({
      where: {
        status: "ACTIVE",
        unit: {
          propertyId: { in: targetPropertyIds },
        },
      },
      include: {
        tenant: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                avatarUrl: true,
              },
            },
          },
        },
        unit: {
          include: {
            property: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also fetch units that have direct tenantName populated but may not have a formal Lease record
    const directUnits = await prisma.unit.findMany({
      where: {
        propertyId: { in: targetPropertyIds },
        status: "OCCUPIED",
        leases: {
          none: {},
        },
      },
      include: {
        property: true,
        unitUser: true,
      },
    });

    const tenantList: any[] = [];
    const processedKeys = new Set<string>();

    // Helper to format phone number to international WhatsApp format
    const formatWaNumber = (phoneStr: string | null | undefined): string => {
      if (!phoneStr) return "";
      let cleaned = phoneStr.replace(/\D/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "62" + cleaned.slice(1);
      }
      return cleaned;
    };

    // Process Leases
    for (const lease of leases) {
      const tenantProfile = lease.tenant;
      const unit = lease.unit;
      const property = unit.property;

      const fullName = tenantProfile.fullName || tenantProfile.user?.fullName || "Penghuni Tanpa Nama";
      const email = tenantProfile.email || tenantProfile.user?.email || null;
      const rawPhone = tenantProfile.phoneNumber || tenantProfile.user?.phoneNumber || null;
      const waNumber = formatWaNumber(rawPhone);

      const uniqueKey = `${tenantProfile.id}-${unit.id}`;
      if (processedKeys.has(uniqueKey)) continue;
      processedKeys.add(uniqueKey);

      // Create pre-filled WhatsApp message
      const defaultMsg = encodeURIComponent(
        `Halo Kak ${fullName}, saya ${authUser.fullName} dari tim Housekeeping ${property.name} (${unit.unitNumber}). `
      );

      tenantList.push({
        id: lease.id,
        tenantProfileId: tenantProfile.id,
        fullName,
        email,
        phoneNumber: rawPhone,
        avatarUrl: tenantProfile.user?.avatarUrl || null,
        nik: tenantProfile.nik || null,
        occupation: tenantProfile.occupation || null,
        gender: tenantProfile.gender || null,
        emergencyName: tenantProfile.emergencyName || null,
        emergencyPhone: tenantProfile.emergencyPhone || null,
        emergencyRelation: tenantProfile.emergencyRelation || null,

        propertyId: property.id,
        propertyName: property.name,
        propertyAddress: property.address,
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        unitFloor: unit.floor,
        unitDimensions: unit.dimensions || "3x4 m",

        leaseId: lease.id,
        leaseStatus: lease.status, // ACTIVE | EXPIRED | etc.
        rentalPeriod: lease.rentalPeriod, // MONTHLY | YEARLY | DAILY | etc.
        rentPrice: Number(lease.rentPrice || 0),
        startDate: lease.startDate ? lease.startDate.toISOString() : null,
        endDate: lease.endDate ? lease.endDate.toISOString() : null,

        waNumber,
        waLink: waNumber ? `https://wa.me/${waNumber}?text=${defaultMsg}` : null,
      });
    }

    // Process Direct Occupied Units (if any)
    for (const unit of directUnits) {
      const property = unit.property;
      const unitUser = unit.unitUser;
      const fullName = unitUser?.fullName || "Penghuni Unit " + unit.unitNumber;
      const rawPhone = unitUser?.phoneNumber || null;
      const waNumber = formatWaNumber(rawPhone);

      const uniqueKey = `direct-${unit.id}`;
      if (processedKeys.has(uniqueKey)) continue;
      processedKeys.add(uniqueKey);

      const defaultMsg = encodeURIComponent(
        `Halo Kak ${fullName}, saya ${authUser.fullName} dari tim Housekeeping ${property.name} (${unit.unitNumber}). `
      );

      tenantList.push({
        id: `unit-${unit.id}`,
        tenantProfileId: null,
        fullName,
        email: unitUser?.email || null,
        phoneNumber: rawPhone,
        avatarUrl: unitUser?.avatarUrl || null,
        nik: null,
        occupation: null,
        gender: null,
        emergencyName: null,
        emergencyPhone: null,
        emergencyRelation: null,

        propertyId: property.id,
        propertyName: property.name,
        propertyAddress: property.address,
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        unitFloor: unit.floor,
        unitDimensions: unit.dimensions || "3x4 m",

        leaseId: null,
        leaseStatus: "ACTIVE",
        rentalPeriod: unit.allowedPeriod || "MONTHLY",
        rentPrice: Number(unit.basePrice || 0),
        startDate: unit.createdAt ? unit.createdAt.toISOString() : null,
        endDate: null,

        waNumber,
        waLink: waNumber ? `https://wa.me/${waNumber}?text=${defaultMsg}` : null,
      });
    }

    // 3. Filter by search query if provided
    let filteredTenants = tenantList;
    if (search) {
      filteredTenants = tenantList.filter(
        (t) =>
          t.fullName.toLowerCase().includes(search) ||
          t.unitNumber.toLowerCase().includes(search) ||
          t.propertyName.toLowerCase().includes(search) ||
          (t.phoneNumber && t.phoneNumber.includes(search)) ||
          (t.email && t.email.toLowerCase().includes(search)) ||
          (t.nik && t.nik.includes(search))
      );
    }

    const activeCount = filteredTenants.filter((t) => t.leaseStatus === "ACTIVE").length;

    return ApiResponse.success({
      message: "Data penghuni lapangan berhasil diambil",
      data: {
        tenants: filteredTenants,
        assignedProperties: assignedPropertiesList,
        meta: {
          totalTenants: filteredTenants.length,
          activeCount,
        },
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/housekeeping/tenants:", error);
    return ApiResponse.error({
      message: "Gagal mengambil data penghuni lapangan",
      error,
    });
  }
}

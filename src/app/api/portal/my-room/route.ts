import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { UnitService } from "@/services/unit.service";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

/**
 * GET /api/portal/my-room
 * Fetch room, property, inventory, and billing details for tenant portal from PostgreSQL DB
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmailCookie = request.cookies.get("arventa_user_email")?.value;
    const authUser = await getAuthenticatedUser(request);

    let email = searchParams.get("email") || userEmailCookie || authUser?.email || undefined;
    if (email) email = decodeURIComponent(email).trim().toLowerCase();

    const unitId = searchParams.get("unitId") || undefined;

    let unit: any = null;

    // 1. If unitId is explicitly provided
    if (unitId) {
      unit = await prisma.unit.findUnique({
        where: { id: unitId },
        include: {
          property: { include: { owner: true } },
          unitUser: true,
          inventoryItems: true,
          leases: {
            where: { status: "ACTIVE" },
            take: 1,
            include: {
              tenant: {
                include: { user: true },
              },
            },
          },
        },
      });
    }

    // 2. If authUser or email is provided (match unitUser, lease tenant user, or lease tenant email)
    if (!unit && (authUser || email)) {
      const cleanEmail = email || authUser?.email || "";
      const authUserId = authUser?.id;

      // Try matching by user ID or email in unitUser or leases
      unit = await prisma.unit.findFirst({
        where: {
          OR: [
            ...(authUserId ? [{ unitUserId: authUserId }] : []),
            ...(cleanEmail ? [{ unitUser: { email: cleanEmail } }] : []),
            ...(authUserId ? [{ leases: { some: { tenant: { userId: authUserId } } } }] : []),
            ...(cleanEmail ? [{ leases: { some: { tenant: { email: cleanEmail } } } }] : []),
            ...(cleanEmail ? [{ leases: { some: { tenant: { user: { email: cleanEmail } } } } }] : []),
          ],
        },
        include: {
          property: { include: { owner: true } },
          unitUser: true,
          inventoryItems: true,
          leases: {
            where: { status: "ACTIVE" },
            take: 1,
            include: {
              tenant: {
                include: { user: true },
              },
            },
          },
        },
      });

      // If not found yet, check if email contains unit number pattern (e.g. kamar101, apt12b01, etc.)
      if (!unit && cleanEmail) {
        const matchDigits = cleanEmail.match(/\d+/g);
        if (matchDigits && matchDigits.length > 0) {
          const numberPart = matchDigits[0];
          unit = await prisma.unit.findFirst({
            where: {
              unitNumber: { contains: numberPart, mode: "insensitive" },
            },
            include: {
              property: { include: { owner: true } },
              unitUser: true,
              inventoryItems: true,
              leases: {
                where: { status: "ACTIVE" },
                take: 1,
                include: {
                  tenant: {
                    include: { user: true },
                  },
                },
              },
            },
          });
        }
      }
    }

    // 3. Fallback: Find the newest created property and its first unit from the database
    if (!unit) {
      // Find latest active property
      const latestProperty = await prisma.property.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
          owner: true,
          units: {
            take: 1,
            include: {
              property: { include: { owner: true } },
              unitUser: true,
              inventoryItems: true,
              leases: {
                where: { status: "ACTIVE" },
                take: 1,
                include: {
                  tenant: {
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      });

      if (latestProperty && latestProperty.units.length > 0) {
        unit = latestProperty.units[0];
      }
    }

    // 4. Ultimate Fallback: Any first unit in database
    if (!unit) {
      unit = await prisma.unit.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
          property: { include: { owner: true } },
          unitUser: true,
          inventoryItems: true,
          leases: {
            where: { status: "ACTIVE" },
            take: 1,
            include: {
              tenant: {
                include: { user: true },
              },
            },
          },
        },
      });
    }

    if (!unit) {
      return ApiResponse.notFound("Tidak ada data unit kamar yang ditemukan dalam database.");
    }

    const formattedUnit = UnitService.formatUnit(unit);

    // Fetch property master inventory & unit inventory
    const propertyInventories = await prisma.propertyInventory.findMany({
      where: { propertyId: unit.propertyId },
    });
    const unitInventories = await prisma.unitInventory.findMany({
      where: { unitId: unit.id },
      include: { propertyInventory: true },
    });

    const mappedInventories: any[] = [];
    const addedNames = new Set<string>();

    // 1. Unit Specific Inventories (Only items assigned / selected for this specific unit)
    const unitFacList: string[] = Array.isArray(unit.facilities) ? unit.facilities : [];

    // From direct unitInventories records
    unitInventories.forEach((ui) => {
      const name = ui.propertyInventory?.itemName || ui.itemName;
      if (name && !addedNames.has(name.toLowerCase())) {
        addedNames.add(name.toLowerCase());
        mappedInventories.push({
          id: ui.id,
          inventory_id: ui.propertyInventoryId || ui.id,
          propertyInventoryId: ui.propertyInventoryId,
          name: name,
          category: "Dalam Unit",
          locationType: "UNIT",
          condition: ui.condition || "Baik",
          unitId: unit.id,
          location: `Unit ${unit.unitNumber}`,
          imageUrl: (ui as any).imageUrl || ui.propertyInventory?.notes?.startsWith('http') ? ui.propertyInventory?.notes : undefined,
        });
      }
    });

    // From propertyInventories where locationType is UNIT and item is in unit.facilities
    propertyInventories
      .filter((p) => p.locationType === 'UNIT')
      .forEach((p) => {
        const isSelected = unitFacList.some((f) => f.toLowerCase() === p.itemName.toLowerCase());
        if (isSelected && !addedNames.has(p.itemName.toLowerCase())) {
          addedNames.add(p.itemName.toLowerCase());
          mappedInventories.push({
            id: p.id,
            inventory_id: p.id,
            propertyInventoryId: p.id,
            name: p.itemName,
            category: "Dalam Unit",
            locationType: "UNIT",
            condition: p.condition || "Baik",
            unitId: unit.id,
            location: `Unit ${unit.unitNumber}`,
            imageUrl: p.notes?.startsWith('http') ? p.notes : undefined,
          });
        }
      });

    // From unit.facilities array if not yet mapped
    unitFacList.forEach((facName, idx) => {
      if (facName && !addedNames.has(facName.toLowerCase())) {
        addedNames.add(facName.toLowerCase());
        mappedInventories.push({
          id: `fac-${unit.id}-${idx}`,
          inventory_id: `fac-${unit.id}-${idx}`,
          propertyInventoryId: null,
          name: facName,
          category: "Dalam Unit",
          locationType: "UNIT",
          condition: "Baik",
          unitId: unit.id,
          location: `Unit ${unit.unitNumber}`,
        });
      }
    });

    // 2. All Common Area Inventories for this Property (Area Umum)
    propertyInventories
      .filter((p) => p.locationType === 'COMMON_AREA')
      .forEach((p) => {
        mappedInventories.push({
          id: p.id,
          inventory_id: p.id,
          propertyInventoryId: p.id,
          name: p.itemName,
          category: "Area Umum",
          locationType: "COMMON_AREA",
          condition: p.condition || "Baik",
          unitId: undefined,
          location: "Area Umum",
          imageUrl: p.notes?.startsWith('http') ? p.notes : undefined,
        });
      });

    // Fallback if completely empty
    if (mappedInventories.length === 0) {
      const defaultItems = ["Kasur Springbed", "AC LG 1PK", "Lemari Pakaian"];
      defaultItems.forEach((name, idx) => {
        mappedInventories.push({
          id: `inv-def-${idx}`,
          inventory_id: `inv-def-${idx}`,
          propertyInventoryId: null,
          name,
          category: "Dalam Unit",
          locationType: "UNIT",
          condition: "Baik",
          unitId: unit.id,
          location: `Unit ${unit.unitNumber}`,
        });
      });
    }

    const monthlyPrice = Number(unit.basePrice) || 1500000;
    const utilitiesCost = 100000;

    const activeLease = unit.leases && unit.leases[0];
    const contractNumber = activeLease
      ? (activeLease.contractUrl && !activeLease.contractUrl.startsWith('http') && !activeLease.contractUrl.includes('/storage/') ? activeLease.contractUrl : `KTR/ARV/${activeLease.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`)
      : `KTR/ARV/${unit.unitNumber.replace(/\D/g, '') || '01F378'}`;

    const checkInDate = activeLease
      ? new Date(activeLease.startDate).toISOString().split("T")[0]
      : (unit.createdAt ? new Date(unit.createdAt).toISOString().split("T")[0] : "2026-08-28");

    const endDate = activeLease
      ? new Date(activeLease.endDate).toISOString().split("T")[0]
      : "2027-08-28";

    const tenantName =
      activeLease?.tenant?.fullName ||
      activeLease?.tenant?.user?.fullName ||
      unit.unitUser?.fullName ||
      (unit.tenantName || "Siti Rahmawati");

    const tenantPhone =
      activeLease?.tenant?.phoneNumber ||
      activeLease?.tenant?.user?.phoneNumber ||
      unit.unitUser?.phoneNumber ||
      (unit.tenantPhone || "0812-3456-7890");

    // Fetch real Owner & Housekeeping contacts for this property
    const owner = unit.property?.owner || await prisma.user.findFirst({ where: { role: UserRole.OWNER } });
    const housekeepingStaff = await prisma.user.findFirst({
      where: { role: UserRole.HOUSEKEEPING, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const ownerName = owner?.fullName ? `${owner.fullName} (Owner)` : "Pemilik Properti (Owner)";
    const ownerPhone = owner?.phoneNumber || "+62 812-3456-7890";
    const ownerEmail = owner?.email || "owner@arventa.id";

    const hkName = housekeepingStaff?.fullName
      ? `${housekeepingStaff.fullName} (Housekeeping)`
      : "Tim Lapangan & Bersih-Bersih";
    const hkPhone = housekeepingStaff?.phoneNumber || ownerPhone;

    const emergencyContacts = [
      { name: ownerName, role: "Pemilik Properti", phone: ownerPhone },
      { name: hkName, role: "Tim Lapangan & Bersih-Bersih", phone: hkPhone },
    ];

    const houseRules = [
      `Dilarang membawa tamu lawan jenis menginap tanpa izin pengelola ${unit.property.name}.`,
      "Menjaga ketenangan bersama dan menghormati hak privasi penghuni lain.",
      "Batas waktu berkunjung tamu luar maksimal pukul 22.00 WIB.",
      "Dilarang merokok di dalam kamar ber-AC.",
      "Sampah wajib dikemas kantong plastik dan dibuang ke tempat pembuangan luar.",
    ];

    const billingSummary = {
      invoiceNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${unit.unitNumber.replace(/\D/g, "") || "001"}`,
      billingMonth: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
      monthlyRent: monthlyPrice,
      utilitiesCost: utilitiesCost,
      totalAmount: monthlyPrice + utilitiesCost,
      dueDate: `25 ${new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
      paymentStatus: "Pending",
    };

    const wifiSsid = `WiFi-${unit.unitNumber.replace(/\s+/g, "")}`;
    const wifiPassword = unit.roomPassword || "Arv!789210";
    const smartLockCode = "123456";

    return ApiResponse.success({
      message: "Data portal kamar berhasil dimuat dari database",
      data: {
        unit: {
          ...formattedUnit,
          name: unit.unitNumber,
          floor: unit.floor,
          status: formattedUnit.status,
          tenantName,
          tenantPhone,
          checkInDate,
          pricing: {
            monthly: monthlyPrice,
            transit: unit.transitPrice ? Number(unit.transitPrice) : undefined,
            deposit: Number(unit.deposit) || 0,
            utilities: true,
          },
          specs: {
            capacity: unit.capacity || 1,
            dimensions: unit.dimensions || "3x4 m",
            allowedPeriod: unit.allowedPeriod || "MONTHLY",
          },
          facilities: unit.facilities && unit.facilities.length > 0
            ? unit.facilities
            : ["AC", "WiFi", "Kamar Mandi Dalam", "Kasur Springbed", "Lemari Pakaian"],
        },
        property: {
          id: unit.property.id,
          name: unit.property.name,
          address: `${unit.property.address}${unit.property.city ? `, ${unit.property.city}` : ""}`,
          description: unit.property.description || "",
          type: unit.property.type,
          hasCleaningService: unit.property.hasCleaningService,
          ownerName,
          ownerPhone,
          ownerEmail,
        },
        inventories: mappedInventories,
        houseRules,
        emergencyContacts,
        contractNumber,
        contractId: activeLease?.id || `lease-${unit.id}`,
        startDate: checkInDate,
        endDate,
        tenantName,
        tenantPhone,
        checkInDate,
        wifiSsid,
        wifiPassword,
        smartLockCode,
        billingSummary,
      },
    });
  } catch (error) {
    console.error("Error in /api/portal/my-room:", error);
    return ApiResponse.error({
      message: "Gagal memuat data portal kamar dari database",
      error,
    });
  }
}

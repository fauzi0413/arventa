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

    const monthlyPrice = Number(unit.basePrice) || 0;
    const utilitiesCost = 0;

    const activeLease = unit.leases && unit.leases.length > 0 ? unit.leases[0] : null;

    const contractNumber = activeLease
      ? (activeLease.contractUrl && !activeLease.contractUrl.startsWith('http') && !activeLease.contractUrl.includes('/storage/') ? activeLease.contractUrl : `KTR/ARV/${activeLease.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`)
      : null;

    const checkInDate = activeLease
      ? new Date(activeLease.startDate).toISOString().split("T")[0]
      : null;

    const endDate = activeLease
      ? new Date(activeLease.endDate).toISOString().split("T")[0]
      : null;

    // Real Tenant: Only if an active lease exists
    const tenantName = activeLease
      ? (activeLease.tenant?.fullName || activeLease.tenant?.user?.fullName || null)
      : null;

    const tenantPhone = activeLease
      ? (activeLease.tenant?.phoneNumber || activeLease.tenant?.user?.phoneNumber || null)
      : null;

    // Real Owner Contact
    const owner = unit.property?.owner || (await prisma.user.findFirst({ where: { id: unit.property.ownerId } }));
    const ownerName = owner?.fullName ? `${owner.fullName} (Owner)` : null;
    const ownerPhone = owner?.phoneNumber || null;
    const ownerEmail = owner?.email || null;

    // Real Housekeeping: ONLY if assigned to this specific property!
    const hkAssignment = await prisma.housekeepingAssignment.findFirst({
      where: {
        propertyId: unit.propertyId,
        user: { isActive: true },
      },
      include: {
        user: true,
      },
    });

    const emergencyContacts: any[] = [];
    if (ownerName && ownerPhone) {
      emergencyContacts.push({
        name: ownerName,
        role: "Pemilik Properti",
        phone: ownerPhone,
      });
    }

    if (hkAssignment?.user) {
      emergencyContacts.push({
        name: `${hkAssignment.user.fullName} (Housekeeping)`,
        role: "Tim Lapangan & Bersih-Bersih",
        phone: hkAssignment.user.phoneNumber || ownerPhone || "-",
      });
    }

    // Real House Rules from Property Contract Template
    const contractTemplate = await prisma.propertyContractTemplate.findUnique({
      where: { propertyId: unit.propertyId },
    });

    let houseRules: string[] = [];
    if (contractTemplate?.rules) {
      try {
        const parsed = JSON.parse(contractTemplate.rules);
        if (Array.isArray(parsed)) {
          houseRules = parsed.filter((r: any) => typeof r === 'string' && r.trim().length > 0);
        } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
          houseRules = [parsed.trim()];
        }
      } catch {
        if (typeof contractTemplate.rules === 'string' && contractTemplate.rules.trim()) {
          houseRules = contractTemplate.rules.split('\n').map(s => s.trim()).filter(Boolean);
        }
      }
    }
    if (contractTemplate?.customClauses && Array.isArray(contractTemplate.customClauses)) {
      houseRules = [...houseRules, ...contractTemplate.customClauses];
    }

    // Real Billing Summary: Only if there is an invoice in DB for this active lease
    let billingSummary: any = null;
    if (activeLease) {
      const latestInvoice = await prisma.invoice.findFirst({
        where: { leaseId: activeLease.id },
        orderBy: { createdAt: "desc" },
      });

      if (latestInvoice) {
        const dueDateFormatted = new Date(latestInvoice.dueDate).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const billingMonthFormatted = new Date(latestInvoice.dueDate).toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        });

        const statusMap: Record<string, 'Lunas' | 'Jatuh Tempo' | 'Pending'> = {
          PAID: 'Lunas',
          OVERDUE: 'Jatuh Tempo',
          PENDING: 'Pending',
          UNPAID: 'Pending',
        };

        billingSummary = {
          invoiceNumber: latestInvoice.invoiceNumber,
          billingMonth: billingMonthFormatted,
          monthlyRent: Number(latestInvoice.amount),
          utilitiesCost: 0,
          totalAmount: Number(latestInvoice.amount),
          dueDate: dueDateFormatted,
          paymentStatus: statusMap[latestInvoice.status] || 'Pending',
        };
      }
    }

    const wifiSsid = unit.property?.hasWifi ? (unit.property.wifiSsid || null) : null;
    const wifiPassword = unit.property?.hasWifi ? (unit.property.wifiPassword || null) : null;
    const smartLockCode = unit.property?.hasSmartLock ? (unit.smartLockPin || null) : null;

    return ApiResponse.success({
      message: "Data portal kamar berhasil dimuat",
      data: {
        unit: {
          ...formattedUnit,
          name: unit.unitNumber,
          floor: unit.floor,
          status: formattedUnit.status,
          tenantName: tenantName || undefined,
          tenantPhone: tenantPhone || undefined,
          checkInDate: checkInDate || undefined,
          smartLockPin: unit.smartLockPin || undefined,
          pricing: {
            monthly: monthlyPrice,
            transit: unit.transitPrice ? Number(unit.transitPrice) : undefined,
            deposit: Number(unit.deposit) || 0,
            utilities: false,
          },
          specs: {
            capacity: unit.capacity || 1,
            dimensions: unit.dimensions || "-",
            allowedPeriod: unit.allowedPeriod || "MONTHLY",
          },
          facilities: Array.isArray(unit.facilities) ? unit.facilities : [],
        },
        property: {
          id: unit.property.id,
          name: unit.property.name,
          address: `${unit.property.address}${unit.property.city ? `, ${unit.property.city}` : ""}`,
          description: unit.property.description || "",
          type: unit.property.type,
          hasCleaningService: unit.property.hasCleaningService,
          hasHousekeepingStaff: Boolean(hkAssignment),
          hasWifi: Boolean(unit.property.hasWifi),
          hasSmartLock: Boolean(unit.property.hasSmartLock),
          ownerName: ownerName || undefined,
          ownerPhone: ownerPhone || undefined,
          ownerEmail: ownerEmail || undefined,
        },
        hasActiveTenant: Boolean(activeLease),
        hasHousekeepingStaff: Boolean(hkAssignment),
        inventories: mappedInventories,
        houseRules,
        emergencyContacts,
        contractNumber,
        contractId: activeLease?.id || null,
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
      message: "Gagal memuat data portal kamar",
      error,
    });
  }
}

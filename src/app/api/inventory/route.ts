import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

/**
 * GET /api/inventory
 * Fetch inventory master items by propertyId and/or unitId.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi pengguna tidak valid");
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const unitId = searchParams.get("unitId");

    // Fetch accessible properties for role
    let accessiblePropertyIds: string[] = [];

    if (authUser.role === UserRole.HOUSEKEEPING) {
      const assignments = await prisma.housekeepingAssignment.findMany({
        where: { userId: authUser.id },
        select: { propertyId: true },
      });
      accessiblePropertyIds = assignments.map((a) => a.propertyId);
    } else if (authUser.role === UserRole.OWNER) {
      const props = await prisma.property.findMany({
        where: { ownerId: authUser.id },
        select: { id: true },
      });
      accessiblePropertyIds = props.map((p) => p.id);
    } else {
      const all = await prisma.property.findMany({ select: { id: true } });
      accessiblePropertyIds = all.map((p) => p.id);
    }

    let targetPropIds = accessiblePropertyIds;
    if (propertyId && propertyId !== "all" && propertyId !== "ALL") {
      targetPropIds = accessiblePropertyIds.filter((id) => id === propertyId);
    }

    const [propInvs, unitInvs] = await Promise.all([
      prisma.propertyInventory.findMany({
        where: { propertyId: { in: targetPropIds } },
        include: { property: { select: { name: true } } },
        orderBy: { itemName: "asc" },
      }),
      prisma.unitInventory.findMany({
        where: {
          unit: {
            propertyId: { in: targetPropIds },
            ...(unitId && unitId !== "all" ? { id: unitId } : {}),
          },
        },
        include: {
          propertyInventory: true,
          unit: {
            select: { id: true, unitNumber: true, propertyId: true, property: { select: { name: true } } },
          },
        },
        orderBy: { itemName: "asc" },
      }),
    ]);

    const formattedPropItems = propInvs.map((p) => ({
      id: p.id,
      propertyId: p.propertyId,
      propertyName: p.property.name,
      unitId: undefined,
      unitName: "Area Umum",
      itemName: p.itemName,
      quantity: p.quantity,
      condition: p.condition,
      notes: p.notes,
      isUnitInventory: false,
      updatedAt: p.updatedAt.toISOString(),
    }));

    const formattedUnitItems = unitInvs.map((u) => ({
      id: u.id,
      propertyInventoryId: u.propertyInventoryId || undefined,
      propertyId: u.unit.propertyId,
      propertyName: u.unit.property.name,
      unitId: u.unit.id,
      unitName: u.unit.unitNumber,
      itemName: u.propertyInventory?.itemName || u.itemName,
      quantity: u.quantity,
      condition: u.condition,
      notes: u.notes,
      isUnitInventory: true,
      updatedAt: u.updatedAt.toISOString(),
    }));

    const allInventory = [...formattedPropItems, ...formattedUnitItems];

    return ApiResponse.success({
      message: "Data inventaris berhasil dimuat",
      data: {
        items: allInventory,
        propertyInventories: formattedPropItems,
        unitInventories: formattedUnitItems,
        meta: {
          totalItems: allInventory.length,
          needRepairCount: allInventory.filter(
            (i) => i.condition === "Perlu Perbaikan" || i.condition === "Rusak Berat"
          ).length,
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/inventory error:", error);
    return ApiResponse.error({
      message: "Gagal memuat inventaris",
      error: error?.message || error,
      status: 500,
    });
  }
}

/**
 * POST /api/inventory
 * Create inventory item or sync unit inventory from Master Inventory.
 * - action === "SYNC_UNIT": syncs unit's items based on an array of master item IDs.
 * - If unitId is present -> requires propertyInventoryId (or matches existing master).
 * - If propertyId is present -> creates Master Property Inventory item.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, propertyId, unitId, propertyInventoryId, itemName, condition, quantity = 1, notes, items } = body;

    // Handle Bulk Sync of Unit Inventory with Master Inventory
    if (action === "SYNC_UNIT" && unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId },
        include: { property: true },
      });

      if (!unit) {
        return ApiResponse.notFound("Unit tidak ditemukan");
      }

      const inputItems: Array<{ inventory_id: string; quantity?: number; condition?: string }> = Array.isArray(items) ? items : [];

      // Fetch all referenced master items to ensure they belong to this property
      const masterIds = inputItems.map((i) => i.inventory_id).filter(Boolean);
      const masterItems = await prisma.propertyInventory.findMany({
        where: {
          id: { in: masterIds },
          propertyId: unit.propertyId,
        },
      });

      const masterMap = new Map(masterItems.map((m) => [m.id, m]));

      // Replace unit inventories in a transaction
      await prisma.$transaction(async (tx) => {
        await tx.unitInventory.deleteMany({
          where: { unitId },
        });

        const createdRows = [];
        const facilityNames: string[] = [];

        for (const item of inputItems) {
          const master = masterMap.get(item.inventory_id);
          if (master) {
            facilityNames.push(master.itemName);
            createdRows.push({
              unitId,
              propertyInventoryId: master.id,
              itemName: master.itemName,
              condition: item.condition || master.condition || "Baik",
              quantity: Number(item.quantity) || 1,
              notes: master.notes || null,
            });
          }
        }

        if (createdRows.length > 0) {
          await tx.unitInventory.createMany({
            data: createdRows,
          });
        }

        // Keep unit facilities string array in sync for legacy compatibility
        await tx.unit.update({
          where: { id: unitId },
          data: {
            facilities: Array.from(new Set(facilityNames)),
          },
        });
      });

      const updatedUnitInvs = await prisma.unitInventory.findMany({
        where: { unitId },
        include: { propertyInventory: true },
      });

      return ApiResponse.success({
        message: "Inventaris unit berhasil disinkronkan dengan Master Inventaris",
        data: updatedUnitInvs,
      });
    }

    // Creating Master Item for Property
    if (propertyId && !unitId) {
      if (!itemName) {
        return ApiResponse.badRequest("Nama barang master wajib diisi");
      }

      const item = await prisma.propertyInventory.create({
        data: {
          propertyId,
          itemName: itemName.trim(),
          condition: condition || "Baik",
          quantity: Number(quantity) || 1,
          notes: notes || null,
        },
      });

      return ApiResponse.success({
        message: "Barang master inventaris properti berhasil ditambahkan",
        data: item,
      });
    }

    // Assigning single master item to a unit
    if (unitId) {
      let resolvedMasterId = propertyInventoryId;
      let finalItemName = itemName;

      if (!resolvedMasterId && itemName) {
        // Find existing master item by name in this property
        const unit = await prisma.unit.findUnique({
          where: { id: unitId },
          select: { propertyId: true },
        });
        if (unit) {
          const existingMaster = await prisma.propertyInventory.findFirst({
            where: { propertyId: unit.propertyId, itemName: { equals: itemName.trim(), mode: "insensitive" } },
          });
          if (existingMaster) {
            resolvedMasterId = existingMaster.id;
            finalItemName = existingMaster.itemName;
          } else {
            // Auto-register to Master Inventory to enforce single source of truth
            const newMaster = await prisma.propertyInventory.create({
              data: {
                propertyId: unit.propertyId,
                itemName: itemName.trim(),
                condition: condition || "Baik",
                quantity: 1,
              },
            });
            resolvedMasterId = newMaster.id;
            finalItemName = newMaster.itemName;
          }
        }
      }

      if (resolvedMasterId) {
        const master = await prisma.propertyInventory.findUnique({
          where: { id: resolvedMasterId },
        });
        if (master) {
          finalItemName = master.itemName;
        }
      }

      if (!finalItemName) {
        return ApiResponse.badRequest("Barang harus dipilih dari Master Inventaris Properti");
      }

      const item = await prisma.unitInventory.create({
        data: {
          unitId,
          propertyInventoryId: resolvedMasterId || null,
          itemName: finalItemName,
          condition: condition || "Baik",
          quantity: Number(quantity) || 1,
          notes: notes || null,
        },
        include: {
          propertyInventory: true,
        },
      });

      return ApiResponse.success({
        message: "Barang berhasil dialokasikan ke unit dari Master Inventaris",
        data: item,
      });
    }

    return ApiResponse.badRequest("propertyId atau unitId wajib disediakan");
  } catch (error: any) {
    console.error("POST /api/inventory error:", error);
    return ApiResponse.error({
      message: "Gagal menyimpan barang inventaris",
      error: error?.message || error,
      status: 500,
    });
  }
}

/**
 * PATCH /api/inventory
 * Update condition, quantity, or notes of an inventory item.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isUnitInventory, condition, quantity, notes, itemName } = body;

    if (!id) {
      return ApiResponse.badRequest("ID inventaris wajib diisi");
    }

    const updatePayload: any = {};
    if (condition !== undefined) updatePayload.condition = condition;
    if (quantity !== undefined) updatePayload.quantity = Number(quantity) || 1;
    if (notes !== undefined) updatePayload.notes = notes;
    if (itemName !== undefined) updatePayload.itemName = itemName;

    if (isUnitInventory) {
      const updated = await prisma.unitInventory.update({
        where: { id },
        data: updatePayload,
      });
      return ApiResponse.success({
        message: "Kondisi inventaris unit berhasil diperbarui",
        data: updated,
      });
    } else {
      const updated = await prisma.propertyInventory.update({
        where: { id },
        data: updatePayload,
      });
      return ApiResponse.success({
        message: "Kondisi inventaris properti berhasil diperbarui",
        data: updated,
      });
    }
  } catch (error: any) {
    console.error("PATCH /api/inventory error:", error);
    return ApiResponse.error({
      message: "Gagal memperbarui inventaris",
      error: error?.message || error,
      status: 500,
    });
  }
}

/**
 * DELETE /api/inventory
 * Delete an inventory item.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const isUnitInventory = searchParams.get("isUnitInventory") === "true";

    if (!id) {
      return ApiResponse.badRequest("ID inventaris wajib diisi");
    }

    if (isUnitInventory) {
      await prisma.unitInventory.delete({ where: { id } });
    } else {
      await prisma.propertyInventory.delete({ where: { id } });
    }

    return ApiResponse.success({
      message: "Barang inventaris berhasil dihapus",
    });
  } catch (error: any) {
    console.error("DELETE /api/inventory error:", error);
    return ApiResponse.error({
      message: "Gagal menghapus inventaris",
      error: error?.message || error,
      status: 500,
    });
  }
}

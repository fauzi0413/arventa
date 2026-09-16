import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { InventoryLocationType } from "@/generated/prisma/client";
import { InventoryService } from "@/services/inventory.service";

/**
 * GET /api/inventory
 * Fetch inventory master items by propertyId and/or unitId with live allocation metrics and optional locationType filter.
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
    const locationType = searchParams.get("locationType") as InventoryLocationType | null;

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

    const propWhere: any = { propertyId: { in: targetPropIds } };
    if (locationType && (locationType === "UNIT" || locationType === "COMMON_AREA")) {
      propWhere.locationType = locationType;
    }

    const [propInvs, unitInvs] = await Promise.all([
      prisma.propertyInventory.findMany({
        where: propWhere,
        include: {
          property: { select: { name: true } },
          unitInventories: {
            select: {
              id: true,
              unitId: true,
              quantity: true,
              condition: true,
              unit: {
                select: {
                  id: true,
                  unitNumber: true,
                },
              },
            },
          },
        },
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

    const formattedPropItems = propInvs.map((p) => {
      const allocatedQuantity = p.unitInventories.reduce((sum, u) => sum + (u.quantity || 1), 0);
      const availableQuantity = Math.max(0, p.quantity - allocatedQuantity);
      const isOverallocated = allocatedQuantity > p.quantity;

      return {
        id: p.id,
        propertyId: p.propertyId,
        propertyName: p.property.name,
        unitId: undefined,
        unitName: p.locationType === "COMMON_AREA" ? "Area Fasilitas Umum" : "Master Kamar",
        itemName: p.itemName,
        locationType: p.locationType,
        quantity: p.quantity,
        condition: p.condition,
        notes: p.notes,
        isUnitInventory: false,
        allocatedQuantity,
        availableQuantity,
        isOverallocated,
        installedUnits: p.unitInventories
          .filter((u) => u.unit?.unitNumber)
          .map((u) => ({
            unitId: u.unitId,
            unitNumber: u.unit.unitNumber,
            quantity: u.quantity || 1,
          })),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

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
          totalMasterItems: formattedPropItems.length,
          totalUnitInstalled: formattedUnitItems.length,
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
    const {
      action,
      propertyId,
      unitId,
      propertyInventoryId,
      itemName,
      condition,
      quantity = 1,
      notes,
      locationType,
      items,
      inventory_ids,
      inventoryIds,
    } = body;

    // Handle Bulk Sync of Unit Inventory with Master Inventory
    if (action === "SYNC_UNIT" && unitId) {
      // Normalize items from various formats (array of objects or array of IDs)
      let normalizedItems: Array<{ propertyInventoryId: string; quantity?: number; condition?: string; notes?: string }> = [];

      if (Array.isArray(items) && items.length > 0) {
        normalizedItems = items.map((i: any) => ({
          propertyInventoryId: i.propertyInventoryId || i.inventory_id || i.id,
          quantity: Number(i.quantity) || 1,
          condition: i.condition,
          notes: i.notes,
        }));
      } else {
        const idList = Array.isArray(inventory_ids)
          ? inventory_ids
          : Array.isArray(inventoryIds)
          ? inventoryIds
          : [];
        normalizedItems = idList.map((id: string) => ({
          propertyInventoryId: id,
          quantity: 1,
        }));
      }

      const updatedUnitInvs = await InventoryService.syncUnitInventory(unitId, normalizedItems);

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

      const resolvedLocType: InventoryLocationType =
        locationType === "COMMON_AREA" ? "COMMON_AREA" : "UNIT";

      const item = await prisma.propertyInventory.create({
        data: {
          propertyId,
          itemName: itemName.trim(),
          locationType: resolvedLocType,
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
                locationType: "UNIT",
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

      // Upsert to handle @@unique([unitId, propertyInventoryId])
      const item = resolvedMasterId
        ? await prisma.unitInventory.upsert({
            where: {
              unitId_propertyInventoryId: {
                unitId,
                propertyInventoryId: resolvedMasterId,
              },
            },
            create: {
              unitId,
              propertyInventoryId: resolvedMasterId,
              itemName: finalItemName,
              condition: condition || "Baik",
              quantity: Number(quantity) || 1,
              notes: notes || null,
            },
            update: {
              quantity: Number(quantity) || 1,
              condition: condition || undefined,
              notes: notes || undefined,
            },
            include: {
              propertyInventory: true,
            },
          })
        : await prisma.unitInventory.create({
            data: {
              unitId,
              propertyInventoryId: null,
              itemName: finalItemName,
              condition: condition || "Baik",
              quantity: Number(quantity) || 1,
              notes: notes || null,
            },
            include: {
              propertyInventory: true,
            },
          });

      // Check allocation warning if bound to master item
      let allocationWarning: string | null = null;
      let stockSummary = null;

      if (resolvedMasterId) {
        stockSummary = await InventoryService.checkStockAllocation(resolvedMasterId);
        if (stockSummary?.isOverallocated) {
          allocationWarning = `Peringatan: Alokasi barang '${finalItemName}' di kamar (${stockSummary.totalAllocated} unit) melebihi stok master yang tercatat (${stockSummary.totalStock} unit).`;
        }
      }

      return ApiResponse.success({
        message: allocationWarning || "Barang berhasil dialokasikan ke unit dari Master Inventaris",
        data: {
          ...item,
          stockAllocation: stockSummary,
          allocationWarning,
        },
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

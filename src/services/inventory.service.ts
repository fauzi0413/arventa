import { prisma } from "@/lib/prisma";
import { InventoryLocationType } from "@/generated/prisma/client";

export interface MasterInventoryFilter {
  locationType?: InventoryLocationType;
  search?: string;
}

export interface StockAllocationSummary {
  propertyInventoryId: string;
  itemName: string;
  locationType: InventoryLocationType;
  totalStock: number;
  totalAllocated: number;
  remainingStock: number;
  isOverallocated: boolean;
  installedUnits: Array<{
    unitId: string;
    unitNumber: string;
    quantity: number;
  }>;
}

export class InventoryService {
  /**
   * Get all master inventory items for a property with live unit allocation metrics
   */
  static async getMasterInventories(
    propertyId: string,
    filter: MasterInventoryFilter = {}
  ) {
    const where: any = { propertyId };

    if (filter.locationType) {
      where.locationType = filter.locationType;
    }

    if (filter.search) {
      where.itemName = { contains: filter.search, mode: "insensitive" };
    }

    const items = await prisma.propertyInventory.findMany({
      where,
      orderBy: { itemName: "asc" },
      include: {
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
    });

    return items.map((inv) => {
      const allocatedQuantity = inv.unitInventories.reduce(
        (sum, u) => sum + (u.quantity || 1),
        0
      );
      const availableQuantity = Math.max(0, inv.quantity - allocatedQuantity);
      const isOverallocated = allocatedQuantity > inv.quantity;

      return {
        id: inv.id,
        propertyId: inv.propertyId,
        itemName: inv.itemName,
        locationType: inv.locationType,
        quantity: inv.quantity,
        condition: inv.condition,
        notes: inv.notes,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
        allocatedQuantity,
        availableQuantity,
        isOverallocated,
        installedUnits: inv.unitInventories
          .filter((u) => u.unit?.unitNumber)
          .map((u) => ({
            unitId: u.unitId,
            unitNumber: u.unit.unitNumber,
            quantity: u.quantity || 1,
          })),
      };
    });
  }

  /**
   * Check stock allocation for a single master inventory item
   * Calculates total allocated = SUM(quantity) di UnitInventory WHERE propertyInventoryId = X
   */
  static async checkStockAllocation(
    propertyInventoryId: string
  ): Promise<StockAllocationSummary | null> {
    const master = await prisma.propertyInventory.findUnique({
      where: { id: propertyInventoryId },
      include: {
        unitInventories: {
          select: {
            unitId: true,
            quantity: true,
            unit: {
              select: {
                id: true,
                unitNumber: true,
              },
            },
          },
        },
      },
    });

    if (!master) return null;

    const totalAllocated = master.unitInventories.reduce(
      (sum, u) => sum + (u.quantity || 1),
      0
    );
    const remainingStock = Math.max(0, master.quantity - totalAllocated);

    return {
      propertyInventoryId: master.id,
      itemName: master.itemName,
      locationType: master.locationType,
      totalStock: master.quantity,
      totalAllocated,
      remainingStock,
      isOverallocated: totalAllocated > master.quantity,
      installedUnits: master.unitInventories.map((u) => ({
        unitId: u.unitId,
        unitNumber: u.unit.unitNumber,
        quantity: u.quantity || 1,
      })),
    };
  }

  /**
   * Check multiple inventory items allocation for warning alerts in UI
   */
  static async checkMultipleStockAllocations(
    propertyInventoryIds: string[]
  ): Promise<Map<string, StockAllocationSummary>> {
    const result = new Map<string, StockAllocationSummary>();
    if (propertyInventoryIds.length === 0) return result;

    const masters = await prisma.propertyInventory.findMany({
      where: { id: { in: propertyInventoryIds } },
      include: {
        unitInventories: {
          select: {
            unitId: true,
            quantity: true,
            unit: {
              select: {
                id: true,
                unitNumber: true,
              },
            },
          },
        },
      },
    });

    for (const master of masters) {
      const totalAllocated = master.unitInventories.reduce(
        (sum, u) => sum + (u.quantity || 1),
        0
      );
      const remainingStock = Math.max(0, master.quantity - totalAllocated);
      result.set(master.id, {
        propertyInventoryId: master.id,
        itemName: master.itemName,
        locationType: master.locationType,
        totalStock: master.quantity,
        totalAllocated,
        remainingStock,
        isOverallocated: totalAllocated > master.quantity,
        installedUnits: master.unitInventories.map((u) => ({
          unitId: u.unitId,
          unitNumber: u.unit.unitNumber,
          quantity: u.quantity || 1,
        })),
      });
    }

    return result;
  }

  /**
   * Sync unit inventory items transactionally with master inventory
   */
  static async syncUnitInventory(
    unitId: string,
    items: Array<{ propertyInventoryId: string; quantity?: number; condition?: string; notes?: string }>
  ) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { id: true, propertyId: true },
    });

    if (!unit) {
      throw new Error("Unit tidak ditemukan");
    }

    // Deduplicate items by propertyInventoryId to respect @@unique([unitId, propertyInventoryId])
    const uniqueItemsMap = new Map<string, { propertyInventoryId: string; quantity: number; condition?: string; notes?: string }>();
    for (const item of items) {
      if (item.propertyInventoryId) {
        uniqueItemsMap.set(item.propertyInventoryId, {
          propertyInventoryId: item.propertyInventoryId,
          quantity: Math.max(1, Number(item.quantity) || 1),
          condition: item.condition,
          notes: item.notes,
        });
      }
    }

    const uniqueItems = Array.from(uniqueItemsMap.values());
    const masterIds = uniqueItems.map((i) => i.propertyInventoryId);

    // Verify all master items belong to this property
    const masterItems = await prisma.propertyInventory.findMany({
      where: {
        id: { in: masterIds },
        propertyId: unit.propertyId,
      },
    });

    const masterMap = new Map(masterItems.map((m) => [m.id, m]));

    return prisma.$transaction(async (tx) => {
      // 1. Clear existing unit inventory
      await tx.unitInventory.deleteMany({
        where: { unitId },
      });

      const facilityNames: string[] = [];
      const createdRows = [];

      for (const item of uniqueItems) {
        const master = masterMap.get(item.propertyInventoryId);
        if (master) {
          facilityNames.push(master.itemName);
          createdRows.push({
            unitId,
            propertyInventoryId: master.id,
            itemName: master.itemName,
            condition: item.condition || master.condition || "Baik",
            quantity: item.quantity,
            notes: item.notes || master.notes || null,
          });
        }
      }

      if (createdRows.length > 0) {
        await tx.unitInventory.createMany({
          data: createdRows,
        });
      }

      // Sync facilities array on unit for backward compatibility
      await tx.unit.update({
        where: { id: unitId },
        data: {
          facilities: Array.from(new Set(facilityNames)),
        },
      });

      // Return refreshed unit inventory
      return tx.unitInventory.findMany({
        where: { unitId },
        include: { propertyInventory: true },
        orderBy: { itemName: "asc" },
      });
    });
  }
}

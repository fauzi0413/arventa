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
      propertyId: u.unit.propertyId,
      propertyName: u.unit.property.name,
      unitId: u.unit.id,
      unitName: u.unit.unitNumber,
      itemName: u.itemName,
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
 * Create inventory item.
 * If unitId is present -> saves to `unit_inventories` table (UnitInventory).
 * If unitId is null/empty -> saves to `property_inventories` table (PropertyInventory).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, unitId, itemName, condition, quantity = 1, notes } = body;

    if (!itemName) {
      return ApiResponse.badRequest("Nama barang wajib diisi");
    }

    if (unitId) {
      const item = await prisma.unitInventory.create({
        data: {
          unitId,
          itemName,
          condition: condition || "Baik",
          quantity: Number(quantity) || 1,
          notes: notes || null,
        },
      });
      return ApiResponse.success({
        message: "Inventaris unit berhasil disimpan ke database",
        data: item,
      });
    } else if (propertyId) {
      const item = await prisma.propertyInventory.create({
        data: {
          propertyId,
          itemName,
          condition: condition || "Baik",
          quantity: Number(quantity) || 1,
          notes: notes || null,
        },
      });
      return ApiResponse.success({
        message: "Inventaris umum properti berhasil disimpan ke database",
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

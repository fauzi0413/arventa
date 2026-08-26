import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/inventory
 * Create inventory item.
 * If unitId is present -> saves to `unit_inventories` table (UnitInventory).
 * If unitId is null/empty -> saves to `property_inventories` table (PropertyInventory).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, unitId, itemName, condition } = body;

    if (!itemName) {
      return ApiResponse.badRequest("Nama barang wajib diisi");
    }

    if (unitId) {
      const item = await prisma.unitInventory.create({
        data: {
          unitId,
          itemName,
          condition: condition || "Baik",
          quantity: 1,
        },
      });
      return ApiResponse.success({
        message: "Inventaris unit berhasil disimpan ke tabel unit_inventories",
        data: item,
      });
    } else if (propertyId) {
      const item = await prisma.propertyInventory.create({
        data: {
          propertyId,
          itemName,
          condition: condition || "Baik",
          quantity: 1,
        },
      });
      return ApiResponse.success({
        message: "Inventaris umum berhasil disimpan ke tabel property_inventories",
        data: item,
      });
    }

    return ApiResponse.badRequest("propertyId atau unitId wajib disediakan");
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal menyimpan barang inventaris",
      error,
    });
  }
}

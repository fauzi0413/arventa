import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { LeaseService } from "@/services/lease.service";
import { UnitService } from "@/services/unit.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/units/[id]/lease
 * Assign tenant to unit by creating active Lease and Tenant User/Profile
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.tenantName) {
      return ApiResponse.badRequest("Nama penyewa wajib diisi.");
    }

    const lease = await LeaseService.assignTenantToUnit(id, {
      tenantName: body.tenantName,
      tenantPhone: body.tenantPhone,
      checkInDate: body.checkInDate || new Date().toISOString(),
      monthlyRent: body.monthlyRent ? Number(body.monthlyRent) : undefined,
      deposit: body.deposit ? Number(body.deposit) : undefined,
    });

    const updatedUnit = await UnitService.getUnitById(id);

    return ApiResponse.success({
      message: "Penyewa berhasil ditambahkan dan kontrak aktif dibuat",
      data: {
        lease,
        unit: updatedUnit,
      },
      status: 201,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal menambahkan penyewa ke kamar",
      error,
    });
  }
}

/**
 * DELETE /api/units/[id]/lease
 * Checkout tenant: Terminate active lease and reset room password & status
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await LeaseService.checkoutTenant(id);
    const updatedUnit = await UnitService.getUnitById(id);

    return ApiResponse.success({
      message: result.message,
      data: {
        unit: updatedUnit,
      },
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal melakukan check-out penyewa",
      error,
    });
  }
}

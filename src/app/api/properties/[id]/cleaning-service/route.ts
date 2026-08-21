import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { PropertyService } from "@/services/property.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/properties/[id]/cleaning-service
 * Toggle or set cleaning service status on property (Owner control)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updated = await PropertyService.toggleCleaningService(id, body.enabled);

    return ApiResponse.success({
      message: `Layanan kebersihan kamar properti berhasil di-${updated.hasCleaningService ? "aktifkan (ON)" : "nonaktifkan (OFF)"}`,
      data: {
        hasCleaningService: updated.hasCleaningService,
        property: updated,
      },
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memperbarui status layanan kebersihan properti",
      error,
    });
  }
}

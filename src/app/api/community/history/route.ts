import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { ApiResponse } from "@/lib/api-response";
import { PropertyChatService } from "@/services/property-chat.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/community/history
 * Query parameters:
 * - propertyId: Property ID (optional)
 * - search: Search keyword for logs, announcements, or pinned messages (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return ApiResponse.error({
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
        status: 401,
      });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await PropertyChatService.getCommunityHistory(
      user.id,
      user.role,
      propertyId,
      search
    );

    if (!data.hasAccess) {
      return ApiResponse.error({
        message: data.error || "Akses ke history komunitas properti ini ditolak.",
        status: 403,
        data: {
          availableProperties: data.availableProperties,
        },
      });
    }

    return ApiResponse.success({
      message: "Berhasil memuat history komunitas kost",
      data: {
        ...data,
        currentUser: {
          id: user.id,
          name: user.fullName,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/community/history error:", error);
    return ApiResponse.error({
      message: error?.message || "Gagal memuat history komunitas.",
      status: 500,
    });
  }
}

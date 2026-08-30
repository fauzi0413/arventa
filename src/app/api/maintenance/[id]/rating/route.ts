import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/maintenance/[id]/rating
 * Submit rating and review feedback for completed ticket.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi pengguna tidak valid atau telah berakhir");
    }

    const body = await request.json();
    const { score, feedback } = body;

    if (!score || typeof score !== "number" || score < 1 || score > 5) {
      return ApiResponse.badRequest("Score rating wajib berupa angka antara 1 dan 5");
    }

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return ApiResponse.notFound("Tiket tidak ditemukan");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.maintenanceTicket.update({
        where: { id },
        data: {
          ratingScore: score,
          ratingFeedback: feedback || null,
          ratedAt: new Date(),
          ratedByName: authUser.fullName,
        },
      });

      await tx.maintenanceTimeline.create({
        data: {
          ticketId: id,
          status: "RATED",
          performerId: authUser.id,
          performerName: authUser.fullName,
          performerRole: authUser.role,
          notes: `Rating ${score} / 5 bintang diberikan oleh ${authUser.fullName}.${feedback ? ` Ulasan: "${feedback}"` : ""}`,
        },
      });

      return t;
    });

    return ApiResponse.success({
      message: "Rating dan ulasan berhasil disimpan",
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/maintenance/[id]/rating error:", error);
    return ApiResponse.error({
      message: "Gagal menyimpan rating tiket",
      error: error?.message || error,
      status: 500,
    });
  }
}

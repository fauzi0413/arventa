import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { parseAnnouncementRecord, serializeAnnouncementContent } from "@/lib/announcement-helper";

/**
 * PATCH /api/announcements/[id]/archive
 * Toggle or set archive status for an announcement
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    const { id } = await context.params;

    const existing = await prisma.announcement.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, ownerId: true } },
        createdBy: { select: { id: true, role: true } },
      },
    });

    if (!existing) {
      return ApiResponse.notFound("Pengumuman tidak ditemukan.");
    }

    const isOwner = authUser.role === UserRole.OWNER && existing.property.ownerId === authUser.id;
    const isCreator = existing.createdById === authUser.id;
    const isAdmin = authUser.role === UserRole.PLATFORM_ADMIN;

    if (!isOwner && !isCreator && !isAdmin) {
      return ApiResponse.forbidden("Anda tidak memiliki izin untuk mengarsipkan pengumuman ini.");
    }

    const parsed = parseAnnouncementRecord(existing);
    const newStatus = parsed.status === "ARCHIVED" ? "PUBLISHED" : "ARCHIVED";

    const serializedContent = serializeAnnouncementContent({
      content: parsed.content,
      status: newStatus,
      targetScope: parsed.targetScope,
      targetUnitIds: parsed.targetUnitIds,
      publishDate: parsed.publishDate,
    });

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        content: serializedContent,
      },
      include: {
        property: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    const parsedUpdated = parseAnnouncementRecord(updated);

    return ApiResponse.success({
      message:
        newStatus === "ARCHIVED"
          ? "Pengumuman berhasil diarsipkan."
          : "Pengumuman berhasil diaktifkan kembali.",
      data: parsedUpdated,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/announcements/[id]/archive:", error);
    return ApiResponse.error({
      message: "Gagal memperbarui status arsip pengumuman",
      error: error?.message,
    });
  }
}

import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { parseAnnouncementRecord, serializeAnnouncementContent } from "@/lib/announcement-helper";
import { AnnouncementFormData, AnnouncementStatus } from "@/app/(dashboard)/community/announcements/types";

/**
 * GET /api/announcements/[id]
 * Fetch a single announcement details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    const { id } = await context.params;

    const record = await prisma.announcement.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, name: true, ownerId: true } },
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    if (!record) {
      return ApiResponse.notFound("Pengumuman tidak ditemukan.");
    }

    // Role-based visibility check
    if (authUser.role === UserRole.OWNER && record.property.ownerId !== authUser.id) {
      return ApiResponse.forbidden("Anda tidak memiliki akses ke pengumuman ini.");
    } else if (authUser.role === UserRole.HOUSEKEEPING) {
      const isAssigned = await prisma.housekeepingAssignment.findFirst({
        where: { userId: authUser.id, propertyId: record.propertyId },
      });
      if (!isAssigned) {
        return ApiResponse.forbidden("Anda tidak memiliki akses ke pengumuman pada properti ini.");
      }
    }

    const parsed = parseAnnouncementRecord(record);

    // Tenant check: must be published and match tenant's room
    if (authUser.role === UserRole.TENANT || authUser.role === UserRole.USER) {
      if (parsed.status !== "PUBLISHED") {
        return ApiResponse.notFound("Pengumuman tidak ditemukan.");
      }
    }

    return ApiResponse.success({
      message: "Detail pengumuman berhasil dimuat",
      data: parsed,
    });
  } catch (error: any) {
    console.error("Error in GET /api/announcements/[id]:", error);
    return ApiResponse.error({
      message: "Gagal memuat detail pengumuman",
      error: error?.message,
    });
  }
}

/**
 * PUT /api/announcements/[id]
 * Edit announcement with STRICT EDIT RESTRICTION (Only DRAFT or SCHEDULED allowed).
 */
export async function PUT(
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

    // Parse existing record to inspect status
    const parsedExisting = parseAnnouncementRecord(existing);

    // STRICT BUSINESS RULE: Only DRAFT or SCHEDULED can be edited!
    if (parsedExisting.status === "PUBLISHED") {
      return ApiResponse.badRequest(
        "Pengumuman yang sudah berstatus PUBLISHED terkunci dan tidak dapat diedit untuk menjaga integritas riwayat pesan penyewa. Anda hanya dapat mengarsipkan atau menghapusnya."
      );
    }

    if (parsedExisting.status === "ARCHIVED") {
      return ApiResponse.badRequest("Pengumuman yang diarsipkan tidak dapat diedit.");
    }

    // Authorization check: Must be owner of property or creator
    const isOwner = authUser.role === UserRole.OWNER && existing.property.ownerId === authUser.id;
    const isCreator = existing.createdById === authUser.id;
    const isAdmin = authUser.role === UserRole.PLATFORM_ADMIN;

    if (!isOwner && !isCreator && !isAdmin) {
      return ApiResponse.forbidden("Anda tidak memiliki izin untuk mengedit pengumuman ini.");
    }

    const body: AnnouncementFormData = await request.json();

    if (!body.title || body.title.trim().length === 0) {
      return ApiResponse.badRequest("Judul pengumuman wajib diisi.");
    }
    if (body.title.length > 120) {
      return ApiResponse.badRequest("Judul pengumuman maksimal 120 karakter.");
    }
    if (!body.content || body.content.trim().length === 0) {
      return ApiResponse.badRequest("Isi pengumuman wajib diisi.");
    }

    // Target scoping validation
    const targetScope = body.targetScope || "SPECIFIC_PROPERTY";
    let targetPropertyId = body.targetPropertyId || existing.propertyId;

    if (authUser.role === UserRole.HOUSEKEEPING) {
      if (targetScope === "ALL_PROPERTIES") {
        return ApiResponse.forbidden("Staf housekeeping tidak memiliki akses broadcast seluruh properti.");
      }
      const isAssigned = await prisma.housekeepingAssignment.findFirst({
        where: { userId: authUser.id, propertyId: targetPropertyId },
      });
      if (!isAssigned) {
        return ApiResponse.forbidden("Staf housekeeping hanya dapat menargetkan properti tugasnya.");
      }
    }

    // Determine new status
    const publishDateStr = body.publishDate ? new Date(body.publishDate).toISOString() : new Date().toISOString();
    const pubDate = new Date(publishDateStr);
    const now = new Date();

    let newStatus: AnnouncementStatus;
    if (body.isDraft) {
      newStatus = "DRAFT";
    } else if (pubDate > now) {
      newStatus = "SCHEDULED";
    } else {
      newStatus = "PUBLISHED";
    }

    let unitIds = body.targetUnitIds;
    if (targetScope === "SPECIFIC_UNITS") {
      if (!unitIds || unitIds.length === 0) {
        return ApiResponse.badRequest("Pilih setidaknya satu kamar untuk target kamar tertentu.");
      }
    } else {
      unitIds = [];
    }

    // Serialize new metadata
    const serializedContent = serializeAnnouncementContent({
      content: body.content.trim(),
      status: newStatus,
      targetScope,
      targetUnitIds: unitIds,
      publishDate: publishDateStr,
    });

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: body.title.trim(),
        content: serializedContent,
        propertyId: targetPropertyId,
      },
      include: {
        property: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    const parsedUpdated = parseAnnouncementRecord(updated);

    return ApiResponse.success({
      message: "Pengumuman berhasil diperbarui",
      data: parsedUpdated,
    });
  } catch (error: any) {
    console.error("Error in PUT /api/announcements/[id]:", error);
    return ApiResponse.error({
      message: "Gagal memperbarui pengumuman",
      error: error?.message,
    });
  }
}

/**
 * DELETE /api/announcements/[id]
 * Delete announcement
 */
export async function DELETE(
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
      },
    });

    if (!existing) {
      return ApiResponse.notFound("Pengumuman tidak ditemukan.");
    }

    const isOwner = authUser.role === UserRole.OWNER && existing.property.ownerId === authUser.id;
    const isCreator = existing.createdById === authUser.id;
    const isAdmin = authUser.role === UserRole.PLATFORM_ADMIN;

    if (!isOwner && !isCreator && !isAdmin) {
      return ApiResponse.forbidden("Anda tidak memiliki izin untuk menghapus pengumuman ini.");
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return ApiResponse.success({
      message: "Pengumuman berhasil dihapus.",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/announcements/[id]:", error);
    return ApiResponse.error({
      message: "Gagal menghapus pengumuman",
      error: error?.message,
    });
  }
}

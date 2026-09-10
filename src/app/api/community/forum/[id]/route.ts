import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { parseForumPostRecord } from "@/lib/forum-helper";

/**
 * GET /api/community/forum/[id]
 * Fetches single forum post with comments, property scoping validation, and author unit metadata.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    const { id } = await params;
    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, name: true, address: true, ownerId: true } },
        author: { select: { id: true, fullName: true, role: true, avatarUrl: true, email: true } },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!post) {
      return ApiResponse.notFound("Diskusi forum tidak ditemukan.");
    }

    // Strict Property Scoping
    if (authUser.role === UserRole.HOUSEKEEPING) {
      const assignment = await prisma.housekeepingAssignment.findFirst({
        where: { userId: authUser.id, propertyId: post.propertyId },
      });
      if (!assignment) {
        return ApiResponse.forbidden("Anda tidak memiliki akses ke forum pada properti ini.");
      }
    } else if (authUser.role === UserRole.OWNER) {
      if (post.property.ownerId !== authUser.id) {
        return ApiResponse.forbidden("Anda bukan pemilik properti ini.");
      }
    }

    // Resolve unit info
    const activeLease = await prisma.lease.findFirst({
      where: {
        status: "ACTIVE",
        unit: { propertyId: post.propertyId },
        OR: [
          { tenant: { userId: post.authorId } },
          { unit: { unitUserId: post.authorId } },
        ],
      },
      select: { unit: { select: { unitNumber: true } } },
    });

    const unitMap = new Map<string, string>();
    if (activeLease?.unit?.unitNumber) {
      unitMap.set(post.authorId, activeLease.unit.unitNumber);
    }

    const postDTO = parseForumPostRecord(post, unitMap);

    return ApiResponse.success({
      message: "Detail diskusi forum berhasil dimuat",
      data: postDTO,
    });
  } catch (error: any) {
    console.error("Error in GET /api/community/forum/[id]:", error);
    return ApiResponse.error({
      message: "Gagal memuat detail diskusi forum",
      error: error?.message,
    });
  }
}

/**
 * DELETE /api/community/forum/[id]
 * Moderation endpoint to remove spam or inappropriate forum thread.
 * Authorized for Housekeeping (assigned property), Owner (owned property), or Platform Admin.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    const { id } = await params;
    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, ownerId: true } },
      },
    });

    if (!post) {
      return ApiResponse.notFound("Diskusi forum tidak ditemukan.");
    }

    // Moderation authorization
    if (authUser.role === UserRole.HOUSEKEEPING) {
      const assignment = await prisma.housekeepingAssignment.findFirst({
        where: { userId: authUser.id, propertyId: post.propertyId },
      });
      if (!assignment) {
        return ApiResponse.forbidden("Anda tidak memiliki hak moderasi pada properti ini.");
      }
    } else if (authUser.role === UserRole.OWNER) {
      if (post.property.ownerId !== authUser.id) {
        return ApiResponse.forbidden("Anda tidak memiliki hak moderasi pada properti ini.");
      }
    } else if (authUser.role !== UserRole.PLATFORM_ADMIN && post.authorId !== authUser.id) {
      return ApiResponse.forbidden("Anda tidak memiliki izin menghapus diskusi ini.");
    }

    await prisma.forumPost.delete({
      where: { id },
    });

    return ApiResponse.success({
      message: "Thread diskusi berhasil dimoderasi / dihapus",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/community/forum/[id]:", error);
    return ApiResponse.error({
      message: "Gagal menghapus thread diskusi",
      error: error?.message,
    });
  }
}

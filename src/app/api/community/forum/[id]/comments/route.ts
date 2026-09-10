import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

/**
 * POST /api/community/forum/[id]/comments
 * Acceptance Criterion #1: Housekeeping & Owner can reply to tenant discussions.
 * Validates strict property scoping before creating comment.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { content } = body;

    if (!content || !content.trim()) {
      return ApiResponse.badRequest("Isi balasan tidak boleh kosong.");
    }

    // 1. Fetch thread to verify existence and property
    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, ownerId: true } },
      },
    });

    if (!post) {
      return ApiResponse.notFound("Diskusi forum tidak ditemukan.");
    }

    // 2. Strict Property Scoping validation
    if (authUser.role === UserRole.HOUSEKEEPING) {
      const assignment = await prisma.housekeepingAssignment.findFirst({
        where: { userId: authUser.id, propertyId: post.propertyId },
      });
      if (!assignment) {
        return ApiResponse.forbidden("Anda tidak ditugaskan pada properti forum ini.");
      }
    } else if (authUser.role === UserRole.OWNER) {
      if (post.property.ownerId !== authUser.id) {
        return ApiResponse.forbidden("Anda bukan pemilik properti ini.");
      }
    } else if (authUser.role !== UserRole.PLATFORM_ADMIN) {
      // Tenant check: must be an active tenant in the same property
      const activeLease = await prisma.lease.findFirst({
        where: {
          status: "ACTIVE",
          unit: { propertyId: post.propertyId },
          OR: [
            { tenant: { userId: authUser.id } },
            { tenant: { email: authUser.email } },
            { unit: { unitUserId: authUser.id } },
          ],
        },
      });
      if (!activeLease) {
        return ApiResponse.forbidden("Anda tidak memiliki akses ke forum pada properti ini.");
      }
    }

    // 3. Create the comment
    const newComment = await prisma.forumComment.create({
      data: {
        postId: id,
        authorId: authUser.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 4. Touch thread updatedAt timestamp
    await prisma.forumPost.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return ApiResponse.success({
      message: "Balasan berhasil dikirimkan",
      data: {
        id: newComment.id,
        content: newComment.content,
        authorId: newComment.authorId,
        authorName: newComment.author.fullName,
        authorRole: newComment.author.role,
        authorAvatar: newComment.author.avatarUrl,
        createdAt: newComment.createdAt.toISOString(),
      },
      status: 201,
    });
  } catch (error: any) {
    console.error("Error in POST /api/community/forum/[id]/comments:", error);
    return ApiResponse.error({
      message: "Gagal mengirimkan balasan",
      error: error?.message,
    });
  }
}

import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import {
  parseForumPostRecord,
  serializeForumContent,
  ForumStatus,
} from "@/lib/forum-helper";

/**
 * PATCH /api/community/forum/[id]/status
 * Acceptance Criterion #2: Housekeeping can mark complaints as resolved.
 * Updates discussion status (OPEN / RESOLVED), logs resolver details and resolution notes.
 */
export async function PATCH(
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
    const { status = "RESOLVED", resolutionNotes = "" } = body;

    // 1. Fetch thread
    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, name: true, ownerId: true } },
        author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
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

    // 2. Strict Property Scoping: Housekeeping must be assigned to this property
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
      return ApiResponse.forbidden("Hanya staf operasional atau pemilik yang dapat mengubah status diskusi.");
    }

    // 3. Parse existing post content to preserve category and raw content
    const currentDTO = parseForumPostRecord(post);
    const targetStatus: ForumStatus = status === "RESOLVED" ? "RESOLVED" : "OPEN";
    const isResolving = targetStatus === "RESOLVED";

    const updatedSerializedContent = serializeForumContent({
      content: currentDTO.content,
      category: currentDTO.category,
      status: targetStatus,
      isResolved: isResolving,
      resolvedAt: isResolving ? new Date().toISOString() : undefined,
      resolvedById: isResolving ? authUser.id : undefined,
      resolvedByName: isResolving ? authUser.fullName : undefined,
      resolutionNotes: isResolving ? resolutionNotes.trim() : undefined,
      isPinned: currentDTO.isPinned,
    });

    // 4. Update the forum post record
    const updatedPost = await prisma.forumPost.update({
      where: { id },
      data: {
        content: updatedSerializedContent,
        updatedAt: new Date(),
      },
      include: {
        property: { select: { id: true, name: true } },
        author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // 5. Automatically append a system audit reply if resolving
    if (isResolving) {
      const noteText = resolutionNotes.trim() ? ` Catatan: "${resolutionNotes.trim()}"` : "";
      await prisma.forumComment.create({
        data: {
          postId: id,
          authorId: authUser.id,
          content: `[SISTEM] Keluhan ini telah ditandai sebagai SELESAI oleh ${authUser.fullName} (${authUser.role === "HOUSEKEEPING" ? "Housekeeping" : "Pengelola"}).${noteText}`,
        },
      });
    }

    const updatedDTO = parseForumPostRecord(updatedPost);

    return ApiResponse.success({
      message: isResolving
        ? "Keluhan berhasil ditandai sebagai selesai"
        : "Status diskusi berhasil dibuka kembali",
      data: updatedDTO,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/community/forum/[id]/status:", error);
    return ApiResponse.error({
      message: "Gagal memperbarui status diskusi keluhan",
      error: error?.message,
    });
  }
}

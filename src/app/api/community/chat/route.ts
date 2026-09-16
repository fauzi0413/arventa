import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { ApiResponse } from "@/lib/api-response";
import { PropertyChatService } from "@/services/property-chat.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/community/chat
 * Query parameters:
 * - propertyId: Target property ID (optional, defaults to first accessible property)
 * - since: ISO timestamp for lightweight incremental polling (optional)
 * - limit: Number of initial history messages to fetch (default: 100)
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
    const since = searchParams.get("since");

    // Lightweight incremental polling: Only fetch messages created after `since`
    if (since && propertyId) {
      const access = await PropertyChatService.verifyPropertyAccess(user.id, user.role, propertyId);
      if (!access.allowed) {
        return ApiResponse.error({
          message: access.reason || "Akses ke chat kost ini ditolak.",
          status: 403,
        });
      }

      // Mark user as read
      await PropertyChatService.markUserRead(propertyId, user.id);

      const sinceDate = new Date(since);
      const [newMessages, recentMessages] = await Promise.all([
        prisma.propertyChatMessage.findMany({
          where: {
            propertyId,
            createdAt: { gt: sinceDate },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.propertyChatMessage.findMany({
          where: { propertyId },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
      ]);

      const [formattedNew, formattedRecent] = await Promise.all([
        PropertyChatService.attachReadStatusToMessages(propertyId, newMessages),
        PropertyChatService.attachReadStatusToMessages(propertyId, recentMessages),
      ]);

      return ApiResponse.success({
        message: "Pesan terbaru dan status centang",
        data: {
          messages: formattedNew,
          statusUpdates: formattedRecent.map((m) => ({
            id: m.id,
            readStatus: m.readStatus,
            readCount: m.readCount,
            totalRecipients: m.totalRecipients,
          })),
        },
      });
    }

    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 100;

    const data = await PropertyChatService.getChatRoomData(user.id, user.role, propertyId, limit);

    if (!data.hasAccess) {
      return ApiResponse.error({
        message: data.error || "Akses ke grup obrolan properti ditolak.",
        status: 403,
        data: {
          availableProperties: data.availableProperties,
        },
      });
    }

    return ApiResponse.success({
      message: "Berhasil memuat ruang obrolan warga kost",
      data,
    });
  } catch (error: any) {
    console.error("GET /api/community/chat error:", error);
    return ApiResponse.error({
      message: error?.message || "Gagal memuat ruang obrolan kost.",
      status: 500,
    });
  }
}

/**
 * POST /api/community/chat
 * Body:
 * - propertyId: Target property ID
 * - content: Message text
 * - mediaUrl: Optional media attachment URL
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return ApiResponse.error({
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
        status: 401,
      });
    }

    const body = await req.json();
    const { propertyId, content, mediaUrl, action } = body;

    if (!propertyId) {
      return ApiResponse.error({
        message: "Property ID wajib disertakan.",
        status: 400,
      });
    }

    // Action: Mark current user as read
    if (action === "mark_read") {
      await PropertyChatService.markUserRead(propertyId, user.id);
      return ApiResponse.success({ message: "Chat ditandai telah dibaca" });
    }

    // Action: Simulate reads for testing WhatsApp checkmark states
    if (action === "simulate_reads") {
      const readType = body.readType || "partial"; // "partial" (Ceklis 2 abu-abu) or "all" (Ceklis 2 biru)
      const resInfo = await PropertyChatService.getPropertyResidents(propertyId);
      const otherUserIds = [
        ...(resInfo.residents || []).map((r: any) => r.userId).filter(Boolean),
        ...(resInfo.managers || []).map((m: any) => m.id).filter(Boolean),
      ].filter((id) => id !== user.id);

      const targetUsers =
        readType === "partial"
          ? otherUserIds.slice(0, Math.max(1, Math.floor(otherUserIds.length / 2)))
          : otherUserIds;

      for (const uId of targetUsers) {
        await PropertyChatService.markUserRead(propertyId, uId);
      }

      return ApiResponse.success({
        message: `Berhasil mensimulasikan status baca (${readType})`,
        data: { simulatedUsers: targetUsers.length, totalRecipients: otherUserIds.length },
      });
    }

    // Action: Pin Message (Owner / Housekeeping only)
    if (action === "pin_message") {
      const { messageId } = body;
      if (!messageId) {
        return ApiResponse.error({ message: "messageId wajib disertakan.", status: 400 });
      }
      const updated = await PropertyChatService.pinMessage(propertyId, messageId, user.id, user.role);
      return ApiResponse.success({ message: "Pesan berhasil disematkan (PIN)", data: updated });
    }

    // Action: Unpin Message (Owner / Housekeeping only)
    if (action === "unpin_message") {
      const { messageId } = body;
      if (!messageId) {
        return ApiResponse.error({ message: "messageId wajib disertakan.", status: 400 });
      }
      const updated = await PropertyChatService.unpinMessage(propertyId, messageId, user.id, user.role);
      return ApiResponse.success({ message: "Sematan pesan berhasil dilepas", data: updated });
    }

    // Action: Create Pinned Announcement
    if (action === "create_pinned_announcement") {
      const { title, content } = body;
      if (!content || !content.trim()) {
        return ApiResponse.error({ message: "Isi pengumuman wajib diisi.", status: 400 });
      }
      const created = await PropertyChatService.sendAnnouncementMessage({
        propertyId,
        title: title || "Pengumuman Pengelola",
        content: content.trim(),
        senderId: user.id,
        senderName: user.fullName || "Pengelola Kost",
      });
      if (created) {
        await PropertyChatService.pinMessage(propertyId, created.id, user.id, user.role);
      }
      return ApiResponse.success({
        message: "Pengumuman berhasil disiarkan dan disematkan!",
        data: created,
      });
    }

    // Action: Delete Message (Sender or Owner/Housekeeping)
    if (action === "delete_message") {
      const { messageId } = body;
      if (!messageId) {
        return ApiResponse.error({ message: "messageId wajib disertakan.", status: 400 });
      }
      const updated = await PropertyChatService.deleteMessage(propertyId, messageId, user.id, user.role);
      return ApiResponse.success({ message: "Pesan berhasil dihapus", data: updated });
    }

    if (!content || !content.trim()) {
      return ApiResponse.error({
        message: "Pesan tidak boleh kosong.",
        status: 400,
      });
    }

    const message = await PropertyChatService.sendMessage({
      userId: user.id,
      role: user.role,
      propertyId,
      content: content.trim(),
      mediaUrl: mediaUrl || undefined,
      replyToId: body.replyToId || undefined,
      replyToContent: body.replyToContent || undefined,
      replyToSenderName: body.replyToSenderName || undefined,
    });

    return ApiResponse.success({
      message: "Pesan berhasil dikirim",
      data: message,
    });
  } catch (error: any) {
    console.error("POST /api/community/chat error:", error);
    return ApiResponse.error({
      message: error?.message || "Gagal mengirim pesan chat.",
      status: 400,
    });
  }
}

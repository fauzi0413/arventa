import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

export const dynamic = "force-dynamic";

/**
 * GET /api/support-tickets
 * Fetch support tickets submitted by current authenticated user, or all if ADMIN.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    const whereClause: any = {};

    if (authUser && authUser.role !== UserRole.PLATFORM_ADMIN) {
      whereClause.reporterEmail = authUser.email;
    }

    if (query.trim()) {
      whereClause.OR = [
        { ticketNumber: { contains: query.trim(), mode: "insensitive" } },
        { subject: { contains: query.trim(), mode: "insensitive" } },
        { message: { contains: query.trim(), mode: "insensitive" } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return ApiResponse.success({
      message: "Daftar tiket berhasil diambil",
      data: tickets,
    });
  } catch (error: any) {
    console.error("GET /api/support-tickets error:", error);
    return ApiResponse.error({ message: "Gagal mengambil daftar tiket laporan" });
  }
}

/**
 * POST /api/support-tickets
 * Create a new support ticket / complaint from dashboard user.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json();
    const {
      reporterName,
      reporterEmail,
      reporterPhone,
      category = "GENERAL",
      priority = "MEDIUM",
      subject,
      message,
    } = body;

    const finalName = reporterName || authUser?.fullName || "User";
    const finalEmail = reporterEmail || authUser?.email || "";
    const finalPhone = reporterPhone || (authUser as any)?.phoneNumber || null;

    if (!finalName.trim() || !finalEmail.trim() || !subject?.trim() || !message?.trim()) {
      return ApiResponse.badRequest("Nama, Email, Subjek, dan Rincian pesan laporan wajib diisi.");
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(100 + Math.random() * 900);
    const ticketNumber = `TKT-${todayStr}-${randomNum}`;

    const newTicket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        reporterName: finalName.trim(),
        reporterEmail: finalEmail.trim().toLowerCase(),
        reporterPhone: finalPhone ? String(finalPhone).trim() : null,
        category: category || "GENERAL",
        priority: priority || "MEDIUM",
        subject: subject.trim(),
        message: message.trim(),
        source: authUser ? `${authUser.role}_PORTAL` : "OWNER_PORTAL",
        status: "OPEN",
      },
    });

    // Write audit log entry if table exists
    try {
      await prisma.auditLog.create({
        data: {
          action: "CREATE_SUPPORT_TICKET",
          entityName: "SupportTicket",
          entityId: newTicket.id,
          details: {
            ticketNumber: newTicket.ticketNumber,
            reporterEmail: newTicket.reporterEmail,
            subject: newTicket.subject,
          },
        },
      });
    } catch (e) {
      console.warn("Audit log creation error (SupportTicket):", e);
    }

    return ApiResponse.success({
      status: 201,
      message: `Tiket bantuan #${newTicket.ticketNumber} berhasil dikirim ke Tim Support Arventa.`,
      data: newTicket,
    });
  } catch (error: any) {
    console.error("POST /api/support-tickets error:", error);
    return ApiResponse.error({ message: error.message || "Gagal membuat tiket laporan kendala" });
  }
}

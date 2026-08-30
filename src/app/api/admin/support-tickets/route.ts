import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

/**
 * GET /api/admin/support-tickets
 * Fetch support tickets with optional filtering & seed defaults if empty.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const query = searchParams.get("query");

    const supportTicketDelegate = (prisma as any).supportTicket;

    let tickets: any[] = [];
    if (supportTicketDelegate) {
      let count = 0;
      try {
        count = await supportTicketDelegate.count();
      } catch (e) {
        console.warn("support_tickets table error or empty:", e);
      }

      if (count === 0) {
        try {
          await supportTicketDelegate.createMany({
            data: [
              {
                ticketNumber: "TKT-20260830-001",
                reporterName: "Budi Santoso",
                reporterEmail: "budi.owner@gmail.com",
                reporterPhone: "081234567890",
                category: "SUBSCRIPTION_BILLING",
                priority: "HIGH",
                subject: "Pertanyaan Pengajuan Faktur Pajak Langganan SaaS",
                message: "Halo tim Arventa, apakah pembayar paket Juragan bulanan dapat diterbitkan Faktur Pajak PPN 11% secara otomatis?",
                status: "OPEN",
                source: "LANDING_PAGE",
                assignedTo: "Tim Billing",
              },
              {
                ticketNumber: "TKT-20260829-002",
                reporterName: "Siti Rahmawati",
                reporterEmail: "siti.kost@yahoo.com",
                reporterPhone: "081987654321",
                category: "TECHNICAL_BUG",
                priority: "MEDIUM",
                subject: "Kamera Scanner QR KTP Lambat Membaca Data",
                message: "Saat proses onboarding penyewa baru, fitur OCR KTP terkadang membutuhkan waktu lebih dari 10 detik. Mohon optimasi.",
                status: "IN_PROGRESS",
                source: "OWNER_PORTAL",
                assignedTo: "Tim IT Support",
                adminReply: "Halo Bu Siti, laporan sedang diperiksa oleh tim engineering kami.",
              },
              {
                ticketNumber: "TKT-20260828-003",
                reporterName: "Hendra Wijaya",
                reporterEmail: "hendra.property@outlook.com",
                reporterPhone: "085678901234",
                category: "FEATURE_REQUEST",
                priority: "LOW",
                subject: "Usulan Integrasi Tambahan Payment Gateway QRIS",
                message: "Bisakah ditambahkan dukungan pembayaran QRIS otomatis melalui Midtrans agar penyewa bisa scan langsung tanpa upload bukti manual?",
                status: "RESOLVED",
                source: "LANDING_PAGE",
                assignedTo: "Tim Produk",
                adminReply: "Fitur QRIS otomatis Midtrans sudah tersedia pada paket Business Pro dan Juragan.",
                resolvedAt: new Date(),
              },
            ],
          });
        } catch (err) {
          console.warn("Failed to seed initial support tickets:", err);
        }
      }

      const whereClause: any = {};
      if (status && status !== "ALL") whereClause.status = status;
      if (category && category !== "ALL") whereClause.category = category;
      if (priority && priority !== "ALL") whereClause.priority = priority;
      if (query) {
        whereClause.OR = [
          { ticketNumber: { contains: query, mode: "insensitive" } },
          { reporterName: { contains: query, mode: "insensitive" } },
          { reporterEmail: { contains: query, mode: "insensitive" } },
          { subject: { contains: query, mode: "insensitive" } },
        ];
      }

      tickets = await supportTicketDelegate.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });
    } else {
      tickets = [
        {
          id: "tkt-1",
          ticketNumber: "TKT-20260830-001",
          reporterName: "Budi Santoso",
          reporterEmail: "budi.owner@gmail.com",
          reporterPhone: "081234567890",
          category: "SUBSCRIPTION_BILLING",
          priority: "HIGH",
          subject: "Pertanyaan Pengajuan Faktur Pajak Langganan SaaS",
          message: "Halo tim Arventa, apakah pembayar paket Juragan bulanan dapat diterbitkan Faktur Pajak PPN 11% secara otomatis?",
          status: "OPEN",
          source: "LANDING_PAGE",
          assignedTo: "Tim Billing",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "tkt-2",
          ticketNumber: "TKT-20260829-002",
          reporterName: "Siti Rahmawati",
          reporterEmail: "siti.kost@yahoo.com",
          reporterPhone: "081987654321",
          category: "TECHNICAL_BUG",
          priority: "MEDIUM",
          subject: "Kamera Scanner QR KTP Lambat Membaca Data",
          message: "Saat proses onboarding penyewa baru, fitur OCR KTP terkadang membutuhkan waktu lebih dari 10 detik. Mohon optimasi.",
          status: "IN_PROGRESS",
          source: "OWNER_PORTAL",
          assignedTo: "Tim IT Support",
          adminReply: "Halo Bu Siti, laporan sedang diperiksa oleh tim engineering kami.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "tkt-3",
          ticketNumber: "TKT-20260828-003",
          reporterName: "Hendra Wijaya",
          reporterEmail: "hendra.property@outlook.com",
          reporterPhone: "085678901234",
          category: "FEATURE_REQUEST",
          priority: "LOW",
          subject: "Usulan Integrasi Tambahan Payment Gateway QRIS",
          message: "Bisakah ditambahkan dukungan pembayaran QRIS otomatis melalui Midtrans agar penyewa bisa scan langsung tanpa upload bukti manual?",
          status: "RESOLVED",
          source: "LANDING_PAGE",
          assignedTo: "Tim Produk",
          adminReply: "Fitur QRIS otomatis Midtrans sudah tersedia pada paket Business Pro dan Juragan.",
          resolvedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    const stats = {
      total: tickets.length,
      open: tickets.filter((t: any) => t.status === "OPEN").length,
      inProgress: tickets.filter((t: any) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t: any) => t.status === "RESOLVED").length,
      closed: tickets.filter((t: any) => t.status === "CLOSED").length,
    };

    return ApiResponse.success({
      message: "Berhasil mengambil data tiket laporan support",
      data: {
        tickets,
        stats,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/support-tickets error:", error);
    return ApiResponse.error({ message: "Gagal mengambil data tiket support" });
  }
}

/**
 * POST /api/admin/support-tickets
 * Create a new support ticket (from public Landing Page or Owner Portal).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reporterName, reporterEmail, reporterPhone, category, priority, subject, message, source } = body;

    if (!reporterName || !reporterEmail || !subject || !message) {
      return ApiResponse.badRequest("Nama, Email, Subjek, dan Pesan laporan wajib diisi");
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(100 + Math.random() * 900);
    const ticketNumber = `TKT-${todayStr}-${randomNum}`;

    const newTicket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        reporterName,
        reporterEmail,
        reporterPhone: reporterPhone || null,
        category: category || "GENERAL",
        priority: priority || "MEDIUM",
        subject,
        message,
        source: source || "LANDING_PAGE",
        status: "OPEN",
      },
    });

    // Write audit log entry
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
      console.warn("Audit log creation error:", e);
    }

    return ApiResponse.success({
      status: 201,
      message: "Tiket laporan support berhasil dibuat",
      data: newTicket,
    });
  } catch (error) {
    console.error("POST /api/admin/support-tickets error:", error);
    return ApiResponse.error({ message: "Gagal membuat tiket laporan support" });
  }
}

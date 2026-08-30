import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

/**
 * GET /api/admin/faqs
 * Fetch FAQs from database with optional role/category filtering.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const targetRole = searchParams.get("targetRole");
    const query = searchParams.get("query");

    let count = 0;
    try {
      count = await prisma.saaSFAQ.count();
    } catch (e) {
      console.warn("saas_faqs table count error:", e);
    }

    // Seed default FAQs if empty
    if (count === 0) {
      try {
        await prisma.saaSFAQ.createMany({
          data: [
            {
              category: "GENERAL",
              question: "Apa itu ARVENTA Property Management SaaS Platform?",
              answer: "ARVENTA adalah platform pengelolaan bisnis properti, kos, dan kontrakan berbasis cloud yang menyediakan modul manajemen penyewa, keuangan, otomatisasi tagihan WhatsApp, hingga reservasi kamar.",
              targetRole: "ALL",
              order: 1,
              isPublished: true,
            },
            {
              category: "SUBSCRIPTION",
              question: "Bagaimana cara upgrade atau pergantian paket langganan SaaS?",
              answer: "Anda dapat berpindah paket langganan kapan saja melalui menu Subscription di dashboard Owner. Perhitungan kredit sisa langganan lama dihitung secara prorate otomatis.",
              targetRole: "OWNER",
              order: 2,
              isPublished: true,
            },
            {
              category: "BILLING",
              question: "Metode pembayaran apa saja yang didukung oleh ARVENTA?",
              answer: "ARVENTA mendukung Transfer Bank Direct (BCA, Mandiri, BNI, BRI), QRIS Dynamic, serta verifikasi bukti transfer manual atau konfirmasi otomatis.",
              targetRole: "ALL",
              order: 3,
              isPublished: true,
            },
            {
              category: "FEATURES",
              question: "Apakah fitur OCR KTP dan Otomatisasi WA sudah termasuk?",
              answer: "Fitur OCR KTP Otomatis dan Pengingat WA Pengagihan Tagihan sudah tersedia mulai dari Paket Pengusaha dan Juragan.",
              targetRole: "OWNER",
              order: 4,
              isPublished: true,
            },
          ],
        });
      } catch (err) {
        console.warn("Failed to seed initial FAQs:", err);
      }
    }

    const whereClause: any = {};
    if (category && category !== "ALL") whereClause.category = category;
    if (targetRole && targetRole !== "ALL") whereClause.targetRole = targetRole;
    if (query) {
      whereClause.OR = [
        { question: { contains: query, mode: "insensitive" } },
        { answer: { contains: query, mode: "insensitive" } },
      ];
    }

    const faqs = await prisma.saaSFAQ.findMany({
      where: whereClause,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return ApiResponse.success({
      message: "Berhasil mengambil data FAQ",
      data: faqs,
    });
  } catch (error) {
    console.error("GET /api/admin/faqs error:", error);
    return ApiResponse.error({ message: "Gagal mengambil data FAQ" });
  }
}

/**
 * POST /api/admin/faqs
 * Create a new FAQ entry in database.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, question, answer, targetRole, order, isPublished } = body;

    if (!question || !answer) {
      return ApiResponse.badRequest("Pertanyaan dan Jawaban FAQ wajib diisi");
    }

    const newFaq = await prisma.saaSFAQ.create({
      data: {
        category: category || "GENERAL",
        question,
        answer,
        targetRole: targetRole || "ALL",
        order: order !== undefined ? Number(order) : 0,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      },
    });

    return ApiResponse.success({
      status: 201,
      message: "FAQ baru berhasil ditambahkan",
      data: newFaq,
    });
  } catch (error) {
    console.error("POST /api/admin/faqs error:", error);
    return ApiResponse.error({ message: "Gagal membuat FAQ baru" });
  }
}

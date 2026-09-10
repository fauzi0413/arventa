import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FAQ_SETTING_KEY = "arventa_faq_items";
const FAQ_CATEGORIES_KEY = "arventa_faq_categories";

/**
 * GET /api/faq
 * Public endpoint — returns only published FAQs grouped by category.
 * Optional ?role= query param to filter by targetRole.
 * No auth required; used by the landing page and dashboard FAQ pages.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const [faqSetting, catSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: FAQ_SETTING_KEY } }),
      prisma.systemSetting.findUnique({ where: { key: FAQ_CATEGORIES_KEY } }),
    ]);

    const allFaqs = faqSetting
      ? (JSON.parse(faqSetting.value) as {
          id: string;
          category: string;
          question: string;
          answer: string;
          targetRole: string;
          order: number;
          isPublished: boolean;
        }[])
      : [];

    const masterCategories: string[] = catSetting
      ? (JSON.parse(catSetting.value) as string[])
      : ["UMUM"];

    // Only published FAQs, filtered by role if provided
    const published = allFaqs
      .filter((f) => {
        if (!f.isPublished) return false;
        if (role) {
          return f.targetRole === "ALL" || f.targetRole === role;
        }
        return true;
      })
      .sort((a, b) => a.order - b.order);

    // Build category → FAQ[] map, preserving master order
    const categoriesWithFaqs = masterCategories.filter((cat) =>
      published.some((f) => f.category.toUpperCase() === cat.toUpperCase())
    );

    const grouped: Record<string, typeof published> = {};
    for (const cat of categoriesWithFaqs) {
      grouped[cat] = published.filter(
        (f) => f.category.toUpperCase() === cat.toUpperCase()
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesWithFaqs,
        faqs: grouped,
      },
    });
  } catch (error) {
    console.error("GET /api/faq error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data FAQ." },
      { status: 500 }
    );
  }
}

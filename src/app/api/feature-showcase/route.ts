import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toFeatureSlide } from "@/lib/feature-showcase";

/**
 * GET /api/feature-showcase
 * Public endpoint — returns only published carousel slides, ordered.
 * No auth required; used by the landing page.
 */
export async function GET() {
  try {
    const records = await prisma.carouselLandingPageFeature.findMany({
      where: { isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    const slides = records.map(toFeatureSlide);

    return NextResponse.json({
      success: true,
      data: slides,
    });
  } catch (error) {
    console.error("GET /api/feature-showcase error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data feature showcase." },
      { status: 500 }
    );
  }
}

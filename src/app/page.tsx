import { LandingPage } from "@/components/landing/landing-page";
import { prisma } from "@/lib/prisma";
import { toFeatureSlide } from "@/lib/feature-showcase";
import type { FeatureSlide } from "@/types/feature-showcase";

export const dynamic = "force-dynamic";

export default async function RootLandingPage() {
  let initialFeatureSlides: FeatureSlide[] = [];
  try {
    const records = await prisma.carouselLandingPageFeature.findMany({
      where: { isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    initialFeatureSlides = records.map(toFeatureSlide);
  } catch (error) {
    console.warn("Failed to fetch initial feature slides in RootLandingPage:", error);
  }

  return <LandingPage initialFeatureSlides={initialFeatureSlides} />;
}


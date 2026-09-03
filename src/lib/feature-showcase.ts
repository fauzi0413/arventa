import type { FeatureSlide } from "@/types/feature-showcase";

// DB record shape as returned by Prisma model CarouselLandingPageFeature
export interface CarouselFeatureRecord {
  id: string;
  badge: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  ctaText: string;
  ctaHref: string;
  mockupType: string;
  headerTitle?: string | null;
  subBadge?: string | null;
  imageUrl?: string | null;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert a DB record (CarouselLandingPageFeature) into the FeatureSlide shape
 * consumed by the CarouselStacked component.
 */
export function toFeatureSlide(record: CarouselFeatureRecord): FeatureSlide {
  return {
    id: record.id,
    badge: record.badge,
    category: record.category,
    title: record.title,
    description: record.description,
    tags: record.tags,
    ctaText: record.ctaText,
    ctaHref: record.ctaHref,
    imageUrl: record.imageUrl || null,
    mockup: {
      type: (record.mockupType as FeatureSlide["mockup"]["type"]) || "property",
      headerTitle: record.headerTitle || "",
      subBadge: record.subBadge || "",
    },
  };
}

/**
 * Allowed mockup types (must match FeatureSlide.mockup.type union).
 */
export const MOCKUP_TYPE_LABELS: Record<string, string> = {
  property: "Property Management",
  tenant: "Tenant Management",
  billing: "Billing & Payment",
  housekeeping: "Housekeeping",
  analytics: "Dashboard & Analytics",
  community: "Community & Announcement",
  ai: "AI Features",
};

export interface FeatureSlideMockup {
  type:
    | "property"
    | "tenant"
    | "billing"
    | "housekeeping"
    | "analytics"
    | "community"
    | "ai";
  headerTitle: string;
  subBadge: string;
}

export interface FeatureSlide {
  id: string;
  badge: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  ctaText: string;
  ctaHref: string;
  imageUrl?: string | null;
  mockup: FeatureSlideMockup;
}

export const FEATURE_MOCKUP_TYPES = [
  "property",
  "tenant",
  "billing",
  "housekeeping",
  "analytics",
  "community",
  "ai",
] as const;

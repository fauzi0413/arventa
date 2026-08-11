import { prisma } from "@/lib/prisma";

/**
 * Fetch status of a single Feature Flag by key from database
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key },
    });
    return flag ? flag.isEnabled : true;
  } catch (error) {
    console.error(`Failed to check Feature Flag '${key}':`, error);
    return true; // Default fallback to enabled if DB error
  }
}

/**
 * Fetch all Feature Flags as a key-value dictionary { [key: string]: boolean }
 */
export async function getFeatureFlagsMap(): Promise<Record<string, boolean>> {
  try {
    const flags = await prisma.featureFlag.findMany();
    const map: Record<string, boolean> = {};
    for (const f of flags) {
      map[f.key] = f.isEnabled;
    }
    return map;
  } catch (error) {
    console.error("Failed to fetch feature flags map:", error);
    return {};
  }
}

import { AnnouncementItem, AnnouncementStatus, TargetScope } from "@/app/(dashboard)/community/announcements/types";

interface StoredMeta {
  status: AnnouncementStatus;
  targetScope: TargetScope;
  targetUnitIds?: string[];
  publishDate: string;
}

const META_PREFIX = "<!--ARVENTA_ANNOUNCEMENT_META:";
const META_SUFFIX = "-->";

/**
 * Serializes announcement metadata into content header comment.
 * Preserves database schema integrity without requiring destructive DDL alterations.
 */
export function serializeAnnouncementContent(params: {
  content: string;
  status: AnnouncementStatus;
  targetScope: TargetScope;
  targetUnitIds?: string[];
  publishDate: string;
}): string {
  const meta: StoredMeta = {
    status: params.status,
    targetScope: params.targetScope,
    targetUnitIds: params.targetUnitIds && params.targetUnitIds.length > 0 ? params.targetUnitIds : undefined,
    publishDate: params.publishDate,
  };

  const metaString = `${META_PREFIX}${JSON.stringify(meta)}${META_SUFFIX}\n`;
  return `${metaString}${params.content}`;
}

/**
 * Parses raw Prisma Announcement record and returns a strongly-typed AnnouncementItem.
 */
export function parseAnnouncementRecord(
  record: any,
  propertyNamesMap?: Map<string, string>,
  unitNumbersMap?: Map<string, string>
): AnnouncementItem {
  let rawContent: string = record.content || "";
  let meta: StoredMeta | null = null;

  if (rawContent.startsWith(META_PREFIX)) {
    const endIndex = rawContent.indexOf(META_SUFFIX);
    if (endIndex !== -1) {
      const jsonStr = rawContent.substring(META_PREFIX.length, endIndex);
      try {
        meta = JSON.parse(jsonStr);
        // Strip the metadata prefix from the display content
        rawContent = rawContent.substring(endIndex + META_SUFFIX.length).replace(/^\n/, "");
      } catch (err) {
        console.error("Failed to parse announcement metadata JSON:", err);
      }
    }
  }

  // Determine effective status
  let effectiveStatus: AnnouncementStatus = meta?.status || "PUBLISHED";
  const publishDateStr = meta?.publishDate || record.createdAt.toISOString();

  // If status is SCHEDULED but publishDate is now past, it transitions to PUBLISHED
  if (effectiveStatus === "SCHEDULED") {
    const pubDate = new Date(publishDateStr);
    if (!isNaN(pubDate.getTime()) && pubDate <= new Date()) {
      effectiveStatus = "PUBLISHED";
    }
  }

  const targetScope: TargetScope = meta?.targetScope || "SPECIFIC_PROPERTY";
  const targetPropertyId = record.propertyId || undefined;
  const targetPropertyName = record.property?.name || (targetPropertyId ? propertyNamesMap?.get(targetPropertyId) : undefined);
  const targetUnitIds = meta?.targetUnitIds || [];
  
  // Resolve unit numbers if mapping provided
  const targetUnitNumbers: string[] = [];
  if (targetUnitIds.length > 0 && unitNumbersMap) {
    for (const uId of targetUnitIds) {
      const num = unitNumbersMap.get(uId);
      if (num) targetUnitNumbers.push(num);
    }
  }

  const createdBy = {
    id: record.createdBy?.id || record.createdById || "",
    name: record.createdBy?.fullName || "Pengelola Properti",
    role: (record.createdBy?.role === "HOUSEKEEPING" ? "HOUSEKEEPING" : "OWNER") as "OWNER" | "HOUSEKEEPING" | "PLATFORM_ADMIN",
  };

  return {
    id: record.id,
    title: record.title,
    content: rawContent,
    status: effectiveStatus,
    targetScope,
    targetPropertyId,
    targetPropertyName,
    targetUnitIds,
    targetUnitNumbers: targetUnitNumbers.length > 0 ? targetUnitNumbers : undefined,
    publishDate: publishDateStr,
    createdBy,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
  };
}

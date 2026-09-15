export type ForumCategory =
  | "OBROLAN_SANTAI"
  | "TANYA_JAWAB"
  | "INFO_KEGIATAN"
  | "PENGUMUMAN"
  | "SAMBUTAN"
  | "DISKUSI"
  | "SARAN"
  | "PERTANYAAN"
  | "KELUHAN";

export type ForumStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface ForumStoredMeta {
  category: ForumCategory;
  status: ForumStatus;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolutionNotes?: string;
  isPinned?: boolean;
}

export interface AuthorResidentMeta {
  unitNumber?: string | null;
  isNewResident?: boolean;
}

export interface ForumCommentDTO {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  authorUnitNumber?: string | null;
  isNewResident?: boolean;
  authorDisplayRole?: string;
  authorDisplayName?: string;
  createdAt: string;
}

export interface ForumPostDTO {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  authorUnitNumber?: string | null;
  isNewResident?: boolean;
  authorDisplayRole?: string;
  authorDisplayName?: string;
  title: string;
  content: string;
  category: ForumCategory;
  status: ForumStatus;
  isResolved: boolean;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  resolvedByName?: string | null;
  resolutionNotes?: string | null;
  isPinned: boolean;
  commentsCount: number;
  comments: ForumCommentDTO[];
  createdAt: string;
  updatedAt: string;
}

const META_PREFIX = "<!--ARVENTA_FORUM_META:";
const META_SUFFIX = "-->";

/**
 * Serializes forum metadata into content header comment.
 * Preserves database schema integrity without requiring destructive DDL alterations.
 */
export function serializeForumContent(params: {
  content: string;
  category?: ForumCategory;
  status?: ForumStatus;
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolutionNotes?: string;
  isPinned?: boolean;
}): string {
  const category: ForumCategory = params.category || "OBROLAN_SANTAI";

  const meta: ForumStoredMeta = {
    category,
    status: params.status || (params.isResolved ? "RESOLVED" : "OPEN"),
    isResolved: Boolean(params.isResolved || params.status === "RESOLVED"),
    resolvedAt: params.resolvedAt,
    resolvedById: params.resolvedById,
    resolvedByName: params.resolvedByName,
    resolutionNotes: params.resolutionNotes,
    isPinned: Boolean(params.isPinned),
  };

  const metaString = `${META_PREFIX}${JSON.stringify(meta)}${META_SUFFIX}\n`;
  return `${metaString}${params.content}`;
}

/**
 * Helper to compute formatted display name and role according to ARVENTA specifications:
 * [Nama Penghuni] - Kamar [Nomor Unit] (e.g., Budi Santoso - Kamar 204)
 * or [Nama] - Pengelola
 */
export function formatResidentIdentity(
  fullName: string,
  role: string,
  unitNumber?: string | null
): { displayName: string; displayRole: string } {
  const isManagement = ["OWNER", "HOUSEKEEPING", "PLATFORM_ADMIN"].includes(role?.toUpperCase() || "");
  if (isManagement) {
    return {
      displayName: `${fullName} - Pengelola`,
      displayRole: "Pengelola",
    };
  }
  if (unitNumber) {
    const cleanUnit = unitNumber.replace(/^(kamar|unit|apt)\s+/i, "").trim();
    return {
      displayName: `${fullName} - Kamar ${cleanUnit}`,
      displayRole: `Kamar ${cleanUnit}`,
    };
  }
  return {
    displayName: fullName,
    displayRole: "Penghuni",
  };
}

/**
 * Parses raw Prisma ForumPost record into a clean ForumPostDTO
 */
export function parseForumPostRecord(
  record: any,
  unitMetaMap?: Map<string, AuthorResidentMeta | string> // userId -> AuthorResidentMeta or unitNumber
): ForumPostDTO {
  let rawContent: string = record.content || "";
  let meta: ForumStoredMeta | null = null;

  if (rawContent.startsWith(META_PREFIX)) {
    const endIndex = rawContent.indexOf(META_SUFFIX);
    if (endIndex !== -1) {
      const jsonStr = rawContent.substring(META_PREFIX.length, endIndex);
      try {
        meta = JSON.parse(jsonStr);
        rawContent = rawContent.substring(endIndex + META_SUFFIX.length).replace(/^\n/, "");
      } catch (err) {
        console.error("Failed to parse forum metadata JSON:", err);
      }
    }
  }

  // Automatic heuristic fallback if no metadata was previously stored
  let category: ForumCategory = meta?.category || "OBROLAN_SANTAI";
  const titleAndContentLower = `${record.title || ""} ${rawContent}`.toLowerCase();
  if (!meta?.category) {
    if (titleAndContentLower.includes("selamat datang penghuni baru") || titleAndContentLower.includes("anak baru")) {
      category = "SAMBUTAN";
    } else if (titleAndContentLower.includes("tanya") || titleAndContentLower.includes("bagaimana") || titleAndContentLower.includes("apakah")) {
      category = "TANYA_JAWAB";
    } else if (titleAndContentLower.includes("kegiatan") || titleAndContentLower.includes("acara") || titleAndContentLower.includes("kerja bakti")) {
      category = "INFO_KEGIATAN";
    } else if (titleAndContentLower.includes("pengumuman") || titleAndContentLower.includes("perhatian")) {
      category = "PENGUMUMAN";
    }
  }

  const isResolved = Boolean(meta?.isResolved || meta?.status === "RESOLVED");
  const status: ForumStatus = meta?.status || (isResolved ? "RESOLVED" : "OPEN");

  const authorId = record.authorId || record.author?.id || "";
  const authorRole = record.author?.role || "TENANT";
  const authorName = record.author?.fullName || "Penghuni";

  // Resolve author metadata (unit & new resident badge)
  let authorUnitNumber: string | null = null;
  let isNewResident = false;

  if (unitMetaMap && unitMetaMap.has(authorId)) {
    const val = unitMetaMap.get(authorId);
    if (typeof val === "string") {
      authorUnitNumber = val;
    } else if (val) {
      authorUnitNumber = val.unitNumber || null;
      isNewResident = Boolean(val.isNewResident);
    }
  }

  // If post title indicates welcome post, flag as new resident for visual delight
  if (category === "SAMBUTAN" && record.title?.includes("Penghuni Baru")) {
    // We keep welcome post highlighted
  }

  const { displayName: authorDisplayName, displayRole: authorDisplayRole } = formatResidentIdentity(
    authorName,
    authorRole,
    authorUnitNumber
  );

  // Format comments with resident identity
  const comments: ForumCommentDTO[] = Array.isArray(record.comments)
    ? record.comments.map((c: any) => {
        const cAuthorId = c.authorId || c.author?.id || "";
        const cAuthorRole = c.author?.role || "TENANT";
        const cAuthorName = c.author?.fullName || "Pengguna";

        let cUnitNumber: string | null = null;
        let cIsNewResident = false;

        if (unitMetaMap && unitMetaMap.has(cAuthorId)) {
          const val = unitMetaMap.get(cAuthorId);
          if (typeof val === "string") {
            cUnitNumber = val;
          } else if (val) {
            cUnitNumber = val.unitNumber || null;
            cIsNewResident = Boolean(val.isNewResident);
          }
        }

        const { displayName: cDisplayName, displayRole: cDisplayRole } = formatResidentIdentity(
          cAuthorName,
          cAuthorRole,
          cUnitNumber
        );

        return {
          id: c.id,
          content: c.content,
          authorId: cAuthorId,
          authorName: cAuthorName,
          authorRole: cAuthorRole,
          authorAvatar: c.author?.avatarUrl || null,
          authorUnitNumber: cUnitNumber,
          isNewResident: cIsNewResident,
          authorDisplayRole: cDisplayRole,
          authorDisplayName: cDisplayName,
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        };
      })
    : [];

  return {
    id: record.id,
    propertyId: record.propertyId || record.property?.id || "",
    propertyName: record.property?.name || "Properti",
    propertyAddress: record.property?.address || undefined,
    authorId,
    authorName,
    authorRole,
    authorAvatar: record.author?.avatarUrl || null,
    authorUnitNumber,
    isNewResident,
    authorDisplayRole,
    authorDisplayName,
    title: record.title,
    content: rawContent,
    category,
    status,
    isResolved,
    resolvedAt: meta?.resolvedAt || null,
    resolvedById: meta?.resolvedById || null,
    resolvedByName: meta?.resolvedByName || null,
    resolutionNotes: meta?.resolutionNotes || null,
    isPinned: Boolean(meta?.isPinned),
    commentsCount: record._count?.comments ?? comments.length,
    comments,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
  };
}

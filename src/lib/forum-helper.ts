export type ForumCategory = "KELUHAN" | "DISKUSI" | "SARAN" | "PERTANYAAN";
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

export interface ForumCommentDTO {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
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
  // Infer category if not provided
  let category: ForumCategory = params.category || "DISKUSI";
  const contentLower = params.content.toLowerCase();
  if (
    !params.category &&
    (contentLower.includes("rusak") ||
      contentLower.includes("bocor") ||
      contentLower.includes("mati") ||
      contentLower.includes("keluhan") ||
      contentLower.includes("komplain") ||
      contentLower.includes("bau") ||
      contentLower.includes("kotor"))
  ) {
    category = "KELUHAN";
  }

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
 * Parses raw Prisma ForumPost record into a clean ForumPostDTO
 */
export function parseForumPostRecord(
  record: any,
  unitNumbersMap?: Map<string, string> // userId -> unitNumber
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
  let category: ForumCategory = meta?.category || "DISKUSI";
  const titleAndContentLower = `${record.title || ""} ${rawContent}`.toLowerCase();
  if (!meta?.category) {
    if (
      titleAndContentLower.includes("rusak") ||
      titleAndContentLower.includes("bocor") ||
      titleAndContentLower.includes("mati") ||
      titleAndContentLower.includes("keluhan") ||
      titleAndContentLower.includes("komplain") ||
      titleAndContentLower.includes("kotor")
    ) {
      category = "KELUHAN";
    }
  }

  const isResolved = Boolean(meta?.isResolved || meta?.status === "RESOLVED");
  const status: ForumStatus = meta?.status || (isResolved ? "RESOLVED" : "OPEN");

  // Format comments
  const comments: ForumCommentDTO[] = Array.isArray(record.comments)
    ? record.comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        authorId: c.authorId || c.author?.id || "",
        authorName: c.author?.fullName || "Pengguna",
        authorRole: c.author?.role || "TENANT",
        authorAvatar: c.author?.avatarUrl || null,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      }))
    : [];

  const authorId = record.authorId || record.author?.id || "";
  const authorUnitNumber = unitNumbersMap ? unitNumbersMap.get(authorId) || null : null;

  return {
    id: record.id,
    propertyId: record.propertyId || record.property?.id || "",
    propertyName: record.property?.name || "Properti",
    propertyAddress: record.property?.address || undefined,
    authorId,
    authorName: record.author?.fullName || "Penghuni",
    authorRole: record.author?.role || "TENANT",
    authorAvatar: record.author?.avatarUrl || null,
    authorUnitNumber,
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

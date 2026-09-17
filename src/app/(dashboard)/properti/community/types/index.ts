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

export interface ForumCommentItem {
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

export interface ForumThreadItem {
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
  comments: ForumCommentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumMetrics {
  totalPosts: number;
  welcomePostsCount: number;
  discussionsCount: number;
  totalRepliesCount: number;
}

export interface ForumFilterState {
  search: string;
  propertyId: string;
  category: string;
  status?: string;
}

export interface AssignedPropertyOption {
  id: string;
  name: string;
  address?: string;
  city?: string;
}

export interface CreateTopicInput {
  title: string;
  content: string;
  propertyId: string;
  category: ForumCategory;
}

export interface ResolveComplaintInput {
  status: ForumStatus;
  resolutionNotes?: string;
}

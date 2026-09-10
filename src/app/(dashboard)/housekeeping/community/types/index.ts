export type ForumCategory = "KELUHAN" | "DISKUSI" | "SARAN" | "PERTANYAAN";
export type ForumStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface ForumCommentItem {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
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
  activeComplaintsCount: number;
  resolvedComplaintsCount: number;
  totalRepliesCount: number;
}

export interface ForumFilterState {
  search: string;
  propertyId: string;
  category: string;
  status: string;
}

export interface AssignedPropertyOption {
  id: string;
  name: string;
  address?: string;
  city?: string;
}

export interface CreateThreadInput {
  title: string;
  content: string;
  propertyId: string;
  category: ForumCategory;
}

export interface ResolveComplaintInput {
  status: ForumStatus;
  resolutionNotes?: string;
}

export interface TenantAnnouncementItem {
  id: string;
  title: string;
  content: string;
  senderName: string;
  senderRole: "OWNER" | "HOUSEKEEPING";
  publishDate: string; // ISO Date String
  isImportant?: boolean; // Badge prioritas pengumuman
  targetScopeLabel: string; // Misal: "Seluruh Penghuni Kost" / "Khusus Lantai 2"
  isRead: boolean;
  propertyInfo?: {
    propertyName: string;
    scopeLabel: string;
  };
}

export type CommunityTab = "ACTIVE" | "HISTORY";

export interface CommunityFilterState {
  activeTab: CommunityTab;
  searchQuery: string;
}

export interface TenantCommunityMeta {
  tab: CommunityTab;
  total: number;
  tenantProperty?: string;
  tenantUnit?: string;
  syncedAt: string;
}

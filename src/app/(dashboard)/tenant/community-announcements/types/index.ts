/**
 * Type definitions for ARV-M5-02 Tenant Announcement Module
 */

export interface TenantAnnouncement {
  id: string;
  title: string;
  content: string;
  senderName: string;
  senderRole: 'OWNER' | 'HOUSEKEEPING';
  publishDate: string;        // ISO Date String
  isRead: boolean;            // Status baca lokal/user preference
  priority?: 'NORMAL' | 'IMPORTANT';
  propertyInfo: {
    propertyName: string;
    scopeLabel: string;       // "Semua Penghuni Properti" / "Khusus Lantai/Kamar Anda"
  };
}

export interface TenantAnnouncementFilter {
  tab: 'LATEST' | 'HISTORY';
  search?: string;
}

export interface TenantAnnouncementMeta {
  tab: 'LATEST' | 'HISTORY';
  total: number;
  tenantProperty?: string;
  tenantUnit?: string;
  syncedAt?: string;
}

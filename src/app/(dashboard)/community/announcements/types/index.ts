export type AnnouncementStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
export type TargetScope = 'ALL_PROPERTIES' | 'SPECIFIC_PROPERTY' | 'SPECIFIC_UNITS';
export type AppUserRole = 'OWNER' | 'HOUSEKEEPING' | 'PLATFORM_ADMIN' | 'TENANT' | 'USER';

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  status: AnnouncementStatus;
  targetScope: TargetScope;
  targetPropertyId?: string;
  targetPropertyName?: string;
  targetUnitIds?: string[];        // Array unit IDs jika target per kamar
  targetUnitNumbers?: string[];    // Array unit numbers untuk display helper
  publishDate: string;             // ISO Date String
  createdBy: {
    id: string;
    name: string;
    role: 'OWNER' | 'HOUSEKEEPING' | 'PLATFORM_ADMIN';
  };
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  targetScope: TargetScope;
  targetPropertyId?: string;
  targetUnitIds?: string[];
  publishDate: string;
  isDraft: boolean;
}

export interface UnitOption {
  id: string;
  unitNumber: string;
  floor: number;
  status?: string;
}

export interface PropertyOption {
  id: string;
  name: string;
  address?: string;
  type?: string;
  units: UnitOption[];
}

export interface AnnouncementFilterState {
  search: string;
  status: AnnouncementStatus | 'ALL';
  propertyId: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ReportType = 'HOUSEKEEPING' | 'MAINTENANCE';

// Housekeeping Lifecycle
export type HousekeepingStatus = 
  | 'REQUESTED' 
  | 'ASSIGNED' 
  | 'IN_CLEANING' 
  | 'COMPLETED' 
  | 'CLOSED';

export type HousekeepingServiceType = 
  | 'DAILY_CLEAN' 
  | 'DEEP_CLEAN' 
  | 'LINEN_CHANGE' 
  | 'CHECKOUT_CLEAN';

export interface HousekeepingChecklist {
  bathroom: boolean;
  bedLinen: boolean;
  floorSweptMopped: boolean;
  trashEmptied: boolean;
}

// Maintenance Lifecycle
export type MaintenanceStatus = 
  | 'REPORTED' 
  | 'INSPECTION' 
  | 'AWAITING_APPROVAL' 
  | 'IN_PROGRESS' 
  | 'RESOLVED' 
  | 'CLOSED';

export type CostLiability = 'OWNER' | 'TENANT' | 'SPLIT';
export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface UserRef {
  id: string;
  name: string;
  role: 'TENANT' | 'STAFF' | 'OWNER';
  avatarUrl?: string;
  phone?: string;
}

export interface ReportPhotos {
  before: string[];
  after: string[];
}

export interface RatingData {
  score: number; // 1 - 5
  feedback?: string;
  ratedAt: string;
  ratedBy: {
    id: string;
    name: string;
  };
}

export interface TimelineLog {
  id: string;
  reportId: string;
  timestamp: string;
  status: string;
  performerName: string;
  performerRole: string;
  notes: string;
  attachmentUrl?: string;
}

// Decoupled Housekeeping Model
export interface HousekeepingReport {
  id: string;
  ticketNumber: string; // e.g. HK-2026-001
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  serviceType: HousekeepingServiceType;
  status: HousekeepingStatus;
  
  reportedBy: UserRef;
  housekeeper?: UserRef;
  notes?: string;
  resolutionNotes?: string;

  checklist?: HousekeepingChecklist;
  photos: ReportPhotos;
  rating: RatingData | null;
  timeline: TimelineLog[];

  createdAt: string;
  updatedAt: string;
}

// Decoupled Maintenance & Repair Model
export interface MaintenanceReportItem {
  id: string;
  ticketNumber: string; // e.g. MNT-2026-001
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  title: string;
  description: string;
  priority: ReportPriority;
  status: MaintenanceStatus;

  reportedBy: UserRef;
  assignedStaff?: UserRef;

  // Cost & Inspection
  estimatedCost?: number;
  costLiability?: CostLiability;
  damageAnalysis?: string;
  actualCost?: number;
  receiptUrl?: string;
  resolutionNotes?: string;

  photos: ReportPhotos;
  rating: RatingData | null;
  timeline: TimelineLog[];

  createdAt: string;
  updatedAt: string;
}

// Unified Filter State
export interface ReportFilterState {
  search: string;
  tab: 'HOUSEKEEPING' | 'MAINTENANCE' | 'HISTORY';
  
  // Housekeeping filters
  housekeepingStatus: HousekeepingStatus | 'ALL';
  serviceType: HousekeepingServiceType | 'ALL';
  housekeeperId: string;

  // Maintenance filters
  maintenanceStatus: MaintenanceStatus | 'ALL';
  priority: ReportPriority | 'ALL';
  costLiability: CostLiability | 'ALL';

  // Global filters
  propertyId: string;
  ratingStatus: 'ALL' | 'RATED' | 'UNRATED';
  startDate: string;
  endDate: string;
}

export interface ReportsMetrics {
  totalHousekeeping: number;
  housekeepingPending: number;
  housekeepingCompleted: number;

  totalMaintenance: number;
  maintenanceReported: number;
  maintenanceAwaitingApproval: number;
  maintenanceInProgress: number;
  maintenanceResolved: number;
}

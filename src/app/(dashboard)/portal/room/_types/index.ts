import { Unit } from '@/app/(dashboard)/units/_types';
import { Property, InventoryItem } from '@/app/(dashboard)/properties/_types';

export interface EmergencyContact {
  id?: string;
  name: string;
  rawName?: string;
  role: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  type?: 'OWNER' | 'HOUSEKEEPING' | string;
}

export interface HousekeepingMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
}

export interface TenantBillingSummary {
  invoiceNumber: string;
  billingMonth: string;
  monthlyRent: number;
  utilitiesCost?: number;
  depositAmount?: number;
  totalAmount: number;
  dueDate: string;
  paymentStatus: 'Lunas' | 'Jatuh Tempo' | 'Pending';
}

export type ComplaintCategory = 'Fasilitas Kamar' | 'Listrik & Lampu' | 'Pipa & Air Mandi' | 'Inventaris Perabot' | 'Jaringan WiFi' | 'Lainnya';
export type ComplaintPriority = 'Biasa' | 'Sedang' | 'Mendesak';
export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface TenantComplaint {
  id: string;
  unitId: string;
  unitName: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: string;
  resolvedAt?: string;
  photoUrl?: string;
  resolutionNotes?: string;
}

export type HousekeepingServiceType = 'Pembersihan Kamar Rutin' | 'Gantian Sprei & Sarung Bantal' | 'Pembersihan Kamar Mandi' | 'Buang Sampah & Vacuum';
export type HousekeepingStatus = 'Diproses' | 'Terjadwal' | 'Selesai';

export interface HousekeepingRequest {
  id: string;
  unitId: string;
  unitName: string;
  serviceType: HousekeepingServiceType;
  scheduledDate: string;
  timeSlot: string;
  notes?: string;
  status: HousekeepingStatus;
  createdAt: string;
  resolutionNotes?: string;
}

export interface TenantRoomDetails {
  unit: Unit;
  property: Property & { hasHousekeepingStaff?: boolean };
  inventories: InventoryItem[];
  houseRules: string[];
  emergencyContacts: EmergencyContact[];
  housekeepingTeam?: HousekeepingMember[];
  billingSummary?: TenantBillingSummary | null;
  complaints?: TenantComplaint[];
  housekeepingRequests?: HousekeepingRequest[];
  wifiSsid?: string | null;
  wifiPassword?: string | null;
  smartLockCode?: string | null;
  hasHousekeepingStaff?: boolean;
  hasActiveTenant?: boolean;
}

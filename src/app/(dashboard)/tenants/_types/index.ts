export type TenantStatus = 'AKTIF' | 'CALON' | 'NONAKTIF';

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface TenantCredential {
  username: string;
  passwordPlain: string;
  wifiSsid?: string;
  wifiPassword?: string;
  smartLockCode?: string;
  generatedAt: string;
}

export type HistoryEventType = 
  | 'INITIAL_PLACEMENT' 
  | 'TRANSFER_UNIT' 
  | 'PREVIOUS_UNIT_RELEASED'
  | 'DEACTIVATED' 
  | 'STATUS_CHANGE'
  | 'REGISTERED';

export interface TenantHistoryRecord {
  id: string;
  type: HistoryEventType;
  title: string;
  description?: string;
  propertyName?: string;
  unitName?: string;
  fromStatus?: TenantStatus;
  toStatus?: TenantStatus;
  timestamp: string;
}

export interface Tenant {
  id: string;
  fullName: string;
  nik: string;
  email: string;
  phoneNumber: string;
  occupation: string;
  emergencyContact?: EmergencyContact;
  status: TenantStatus;
  
  // Placement / Lease details (optional if CALON/NONAKTIF without active unit)
  currentPropertyId?: string;
  currentPropertyName?: string;
  currentUnitId?: string;
  currentUnitName?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  
  history?: TenantHistoryRecord[];

  notes?: string;
  avatarUrl?: string;
  ktpImageUrl?: string;
  birthPlaceDate?: string;
  gender?: string;
  bloodType?: string;
  addressKtp?: string;
  rtRw?: string;
  kelDesa?: string;
  kecamatan?: string;
  religion?: string;
  maritalStatus?: string;
  nationality?: string;
  validUntil?: string;
  createdAt: string;

  // Legacy optional credentials for backwards compatibility with other modules
  credentialCreated?: boolean;
  credential?: TenantCredential;
}

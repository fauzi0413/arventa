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
  
  notes?: string;
  avatarUrl?: string;
  ktpImageUrl?: string;
  createdAt: string;

  // Legacy optional credentials for backwards compatibility with other modules
  credentialCreated?: boolean;
  credential?: TenantCredential;
}

export interface TenantCredential {
  username: string;
  passwordPlain: string;
  wifiSsid?: string;
  wifiPassword?: string;
  smartLockCode?: string;
  generatedAt: string;
}

export interface Tenant {
  id: string; // Matches the lease/unit tenant identifier
  fullName: string;
  email: string;
  phoneNumber: string;
  nik?: string;
  occupation?: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitName: string;
  checkInDate: string;
  credentialCreated: boolean;
  credential?: TenantCredential;
}

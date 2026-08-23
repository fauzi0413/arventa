export type ContractStatus = 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'TERMINATED';
export type ContractScope = 'UNIT' | 'PROPERTY';
export type RentalPeriod = 'HOURLY' | 'DAILY' | 'MONTHLY' | 'YEARLY';

export interface PropertyOption {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
}

export interface UnitOption {
  id: string;
  propertyId: string;
  propertyName?: string;
  unitNumber: string;
  basePrice: number;
  deposit: number;
  status: string;
}

export interface TenantOption {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  nik?: string;
  hasActiveContract?: boolean;
  status?: string;
}

export interface ContractItem {
  id: string;
  contractNumber: string;
  scope: ContractScope;
  status: ContractStatus;
  
  // Tenant
  tenantId: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  tenantNik?: string;

  // Property & Unit
  propertyId: string;
  propertyName: string;
  propertyAddress?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  unitId?: string;
  unitName?: string;

  // Financials & Term
  rentalPeriod: RentalPeriod;
  startDate: string;
  endDate: string;
  rentPrice: number;
  securityDeposit: number;
  
  // Custom clauses / notes
  customClauses?: string[];
  notes?: string;
  contractUrl?: string;

  createdAt: string;
  updatedAt?: string;
}

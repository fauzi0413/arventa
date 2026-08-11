export type UnitStatus = 'Available' | 'Occupied' | 'Need Cleaning' | 'Maintenance';

export interface UnitPricing {
  monthly: number;
  daily?: number;
  yearly?: number;
  deposit: number;
  utilities?: string;
}

export interface UnitCapacity {
  maxPersons: number;
  dimensions: string; // e.g. "3x4 m"
}

export interface Unit {
  id: string;
  propertyId: string;
  name: string; // e.g., "Kamar 101"
  status: UnitStatus;
  facilities: string[];
  capacity: UnitCapacity;
  pricing: UnitPricing;
  description: string;
  tenantName?: string;
  tenantPhone?: string;
  checkInDate?: string;
  createdAt: string;
}

export type UnitStatus = 'Available' | 'Occupied' | 'Need Cleaning' | 'Maintenance' | 'Reserved';

export interface UnitPricing {
  monthly: number;
  daily?: number;
  yearly?: number;
  deposit: number;
  utilities?: string;
  billingScheme?: 'monthly' | 'daily' | 'yearly' | 'custom';
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
  imageUrl?: string;
  tenantName?: string;
  tenantPhone?: string;
  checkInDate?: string;
  createdAt: string;
}

export type BulkActionType = 'status' | 'facilities' | 'pricing' | 'delete';

export interface BulkActionPayload {
  actionType: BulkActionType;
  newStatus?: UnitStatus;
  facilityOperation?: 'add' | 'remove';
  facilitiesToApply?: string[];
  priceAdjustmentType?: 'set' | 'flat_increase' | 'flat_decrease' | 'percent_increase' | 'percent_decrease';
  priceValue?: number;
}

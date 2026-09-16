export interface PropertyCategory {
  id: string;
  name: string;
  description?: string;
}

export interface PropertyStatus {
  id: string;
  name: string;
  color: string; // Hex color code
}

export interface Property {
  id: string;
  name: string;
  address: string;
  categoryId: string;
  statusId: string;
  totalUnits: number;
  occupiedUnits: number;
  description: string;
  imageUrl?: string;
  hasCleaningService?: boolean;
  defaultLateFee?: number;
  defaultDeposit?: number;
  createdAt: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
}

export type InventoryCondition = 'Baik' | 'Perlu Perbaikan' | 'Rusak Berat' | 'Hilang';

export interface InventoryItem {
  id: string;
  propertyId: string;
  unitId?: string; // Optional: associated room unit ID (e.g. "unit-1")
  unitName?: string; // Cache room name or area label
  name: string; // e.g., "AC", "Kasur", "Lemari"
  locationType?: 'UNIT' | 'COMMON_AREA';
  condition: InventoryCondition;
  imageUrl?: string; // Photo of item/condition
  lastUpdated: string;
}


import { Unit } from '@/app/(dashboard)/units/_types';
import { Property, InventoryItem } from '@/app/(dashboard)/properties/_types';

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
}

export interface TenantRoomDetails {
  unit: Unit;
  property: Property;
  inventories: InventoryItem[];
  houseRules: string[];
  emergencyContacts: EmergencyContact[];
  wifiSsid?: string;
  wifiPassword?: string;
  smartLockCode?: string;
}

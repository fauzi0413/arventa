export interface AssignedProperty {
  id: string;
  name: string;
  type?: string;
  address?: string;
  city?: string;
}

export interface HousekeepingMember {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  assignedProperties: AssignedProperty[];
  totalPropertiesCount?: number;
  totalStatusLogsCount?: number;
  totalExpensesCount?: number;
}

export interface ActivityItem {
  id: string;
  type: "ROOM_STATUS" | "EXPENSE" | "CHECKIN_CHECKOUT";
  typeLabel: string;
  performerName: string;
  performerRole: string;
  propertyName: string;
  propertyId?: string;
  unitNumber: string;
  activity: string;
  notes?: string;
  previousStatus?: string;
  newStatus?: string;
  amount?: number;
  category?: string;
  receiptUrl?: string;
  fromStatus?: string;
  toStatus?: string;
  timestamp: string;
}

export interface PropertyOption {
  id: string;
  name: string;
  address?: string;
}

export type MessageType = "CHAT" | "SYSTEM_JOIN" | "SYSTEM_LEAVE" | "ANNOUNCEMENT";
export type MessageReadStatus = "SENT" | "DELIVERED" | "READ_ALL";

export interface PropertyChatMessageItem {
  id: string;
  propertyId: string;
  senderId: string;
  messageType: MessageType;
  content: string;
  mediaUrl?: string | null;
  senderName: string;
  senderUnitNumber?: string | null;
  senderRole: string;
  createdAt: string;
  isPinned?: boolean;
  pinnedAt?: string | null;
  pinnedById?: string | null;
  replyToId?: string | null;
  replyToContent?: string | null;
  replyToSenderName?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  readStatus?: MessageReadStatus; // SENT (Ceklis 1), DELIVERED (Ceklis 2 ga biru), READ_ALL (Ceklis 2 biru)
  readCount?: number;
  totalRecipients?: number;
  pending?: boolean;
  error?: boolean;
}

export interface ChatResidentItem {
  id: string;
  name: string;
  role: string;
  displayRole: string;
  unitNumber?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  leaseStartDate?: string | null;
  leaseEndDate?: string | null;
  status: string;
}

export interface ChatRoomProperty {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  coverImage?: string | null;
  totalUnits?: number;
}

export interface AvailablePropertyOption {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  coverImage?: string | null;
  type?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  lastSenderName?: string | null;
  unreadCount?: number;
  activeTenantsCount?: number;
}

export interface ChatCurrentUser {
  id: string;
  role: string;
  name: string;
  unitNumber?: string | null;
}

export interface ChatRoomResponseData {
  property: ChatRoomProperty | null;
  activeTenantsCount: number;
  managementCount: number;
  residents: ChatResidentItem[];
  messages: PropertyChatMessageItem[];
  pinnedMessages?: PropertyChatMessageItem[];
  currentUser: ChatCurrentUser;
  availableProperties: AvailablePropertyOption[];
  hasAccess: boolean;
  error?: string;
}

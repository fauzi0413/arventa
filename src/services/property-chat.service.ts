import { prisma } from "@/lib/prisma";
import { MessageType, UserRole } from "@/generated/prisma/client";

export interface ChatAccessResult {
  allowed: boolean;
  senderName: string;
  senderRole: string;
  senderUnitNumber?: string;
  reason?: string;
}

export interface SendMessageParams {
  userId: string;
  role: string;
  propertyId: string;
  content: string;
  mediaUrl?: string;
  replyToId?: string;
  replyToContent?: string;
  replyToSenderName?: string;
}

export class PropertyChatService {
  /**
   * Get all properties accessible by this user based on strict role scoping:
   * - PLATFORM_ADMIN: All properties
   * - OWNER: Properties owned by user
   * - HOUSEKEEPING: Properties assigned to user
   * - TENANT / USER: Property where user has an ACTIVE lease or is assigned to room account
   */
  static async getUserAccessibleProperties(userId: string, role: string) {
    if (role === UserRole.PLATFORM_ADMIN) {
      return prisma.property.findMany({
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          coverImage: true,
          type: true,
        },
        orderBy: { name: "asc" },
      });
    }

    if (role === UserRole.OWNER) {
      return prisma.property.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          coverImage: true,
          type: true,
        },
        orderBy: { name: "asc" },
      });
    }

    if (role === UserRole.HOUSEKEEPING) {
      return prisma.property.findMany({
        where: {
          housekeepingAssignments: {
            some: { userId },
          },
        },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          coverImage: true,
          type: true,
        },
        orderBy: { name: "asc" },
      });
    }

    // TENANT / USER: Only property where they have an ACTIVE lease
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantProfile: {
          include: {
            leases: {
              where: { status: "ACTIVE" },
              include: {
                unit: {
                  include: {
                    property: {
                      select: {
                        id: true,
                        name: true,
                        city: true,
                        address: true,
                        coverImage: true,
                        type: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        unitAccount: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                coverImage: true,
                type: true,
              },
            },
          },
        },
      },
    });

    const propMap = new Map<string, any>();

    // 1. Check leases in tenant profile
    if (user?.tenantProfile?.leases) {
      for (const lease of user.tenantProfile.leases) {
        if (lease.unit?.property) {
          propMap.set(lease.unit.property.id, lease.unit.property);
        }
      }
    }

    // 2. Check room account
    if (user?.unitAccount?.property) {
      propMap.set(user.unitAccount.property.id, user.unitAccount.property);
    }

    return Array.from(propMap.values());
  }

  /**
   * Verify if a user has permission to read and send messages in a property chat room
   */
  static async verifyPropertyAccess(
    userId: string,
    role: string,
    propertyId: string
  ): Promise<ChatAccessResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantProfile: {
          include: {
            leases: {
              where: {
                status: "ACTIVE",
                unit: { propertyId },
              },
              include: { unit: true },
            },
          },
        },
        unitAccount: {
          include: { property: true },
        },
      },
    });

    if (!user) {
      return { allowed: false, senderName: "", senderRole: "", reason: "User tidak ditemukan." };
    }

    // 1. Platform Admin: Superuser access
    if (role === UserRole.PLATFORM_ADMIN) {
      return {
        allowed: true,
        senderName: user.fullName || "Admin Arventa",
        senderRole: "PLATFORM_ADMIN",
      };
    }

    // 2. Owner: Must own this property
    if (role === UserRole.OWNER) {
      const property = await prisma.property.findFirst({
        where: { id: propertyId, ownerId: userId },
      });

      if (!property) {
        return {
          allowed: false,
          senderName: user.fullName,
          senderRole: "OWNER",
          reason: "Anda bukan pemilik properti ini.",
        };
      }

      return {
        allowed: true,
        senderName: user.fullName || "Pemilik Kost",
        senderRole: "OWNER",
      };
    }

    // 3. Housekeeping: Must be assigned to this property
    if (role === UserRole.HOUSEKEEPING) {
      const assignment = await prisma.housekeepingAssignment.findFirst({
        where: { userId, propertyId },
      });

      if (!assignment) {
        return {
          allowed: false,
          senderName: user.fullName,
          senderRole: "HOUSEKEEPING",
          reason: "Anda tidak ditugaskan pada properti ini.",
        };
      }

      return {
        allowed: true,
        senderName: user.fullName || "Staf Housekeeping",
        senderRole: "HOUSEKEEPING",
      };
    }

    // 4. Tenant / User: Must have an ACTIVE lease in this property or be the unit account
    const activeLeaseInProp = user.tenantProfile?.leases?.find(
      (l) => l.unit.propertyId === propertyId
    );

    if (activeLeaseInProp) {
      return {
        allowed: true,
        senderName: user.fullName || user.tenantProfile?.fullName || "Penghuni",
        senderRole: "TENANT",
        senderUnitNumber: activeLeaseInProp.unit.unitNumber,
      };
    }

    // Check room account
    if (user.unitAccount && user.unitAccount.propertyId === propertyId) {
      return {
        allowed: true,
        senderName: user.fullName || `Kamar ${user.unitAccount.unitNumber}`,
        senderRole: "TENANT",
        senderUnitNumber: user.unitAccount.unitNumber,
      };
    }

    return {
      allowed: false,
      senderName: user.fullName,
      senderRole: "TENANT",
      reason: "Anda tidak memiliki sewa aktif pada kamar di properti ini.",
    };
  }

  /**
   * Get all active residents (tenants) and management staff for the "Daftar Warga" modal
   */
  static async getPropertyResidents(propertyId: string) {
    // 1. Active Units & Tenants
    const units = await prisma.unit.findMany({
      where: { propertyId },
      include: {
        leases: {
          where: { status: "ACTIVE" },
          include: {
            tenant: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    phoneNumber: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { unitNumber: "asc" },
    });

    const residents = units
      .filter((u) => u.leases && u.leases.length > 0)
      .map((u) => {
        const lease = u.leases[0];
        const tenantUser = lease.tenant?.user;
        const tenantUserId = tenantUser?.id || lease.tenant?.userId || null;
        const name = lease.tenant?.fullName || tenantUser?.fullName || "Penghuni";
        const phone = lease.tenant?.phoneNumber || tenantUser?.phoneNumber || null;
        return {
          unitId: u.id,
          unitNumber: u.unitNumber,
          floor: u.floor,
          userId: tenantUserId,
          tenantName: name,
          tenantPhone: phone,
          avatarUrl: tenantUser?.avatarUrl || null,
          startDate: lease.startDate,
          endDate: lease.endDate,
        };
      });

    // 2. Managers: Property Owner & Assigned Housekeeping
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
          },
        },
        housekeepingAssignments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const managers = [];
    if (property?.owner) {
      managers.push({
        id: property.owner.id,
        name: property.owner.fullName || "Pemilik Kost",
        phone: property.owner.phoneNumber,
        avatarUrl: property.owner.avatarUrl,
        role: "OWNER",
        roleLabel: "Pemilik Kost",
      });
    }

    if (property?.housekeepingAssignments) {
      for (const assignment of property.housekeepingAssignments) {
        if (assignment.user) {
          managers.push({
            id: assignment.user.id,
            name: assignment.user.fullName || "Tim Operasional",
            phone: assignment.user.phoneNumber,
            avatarUrl: assignment.user.avatarUrl,
            role: "HOUSEKEEPING",
            roleLabel: "Staf Housekeeping",
          });
        }
      }
    }

    return {
      residents,
      managers,
      activeResidentsCount: residents.length,
      managersCount: managers.length,
    };
  }

  /**
   * Fetch complete chat room state (property info, residents, recent messages, accessible properties)
   */
  static async getChatRoomData(
    userId: string,
    role: string,
    requestedPropertyId?: string,
    limit: number = 100
  ) {
    const accessibleProperties = await this.getUserAccessibleProperties(userId, role);

    if (accessibleProperties.length === 0) {
      return {
        hasAccess: false,
        error: "Tidak ada properti aktif yang dapat Anda akses.",
        availableProperties: [],
        property: null,
        residentsInfo: null,
        messages: [],
      };
    }

    // Resolve active property: either requested (if accessible) or first accessible property
    let activeProperty = requestedPropertyId
      ? accessibleProperties.find((p) => p.id === requestedPropertyId)
      : accessibleProperties[0];

    if (!activeProperty) {
      activeProperty = accessibleProperties[0];
    }

    const access = await this.verifyPropertyAccess(userId, role, activeProperty.id);
    if (!access.allowed) {
      return {
        hasAccess: false,
        error: access.reason || "Akses ditolak.",
        availableProperties: accessibleProperties,
        property: activeProperty,
        residentsInfo: null,
        messages: [],
      };
    }

    // Fetch messages & residents in parallel
    const [messages, residentsInfo] = await Promise.all([
      prisma.propertyChatMessage.findMany({
        where: { propertyId: activeProperty.id },
        orderBy: { createdAt: "asc" },
        take: limit,
      }),
      this.getPropertyResidents(activeProperty.id),
    ]);

    // Mark current user as having read the chat room up to now
    await this.markUserRead(activeProperty.id, userId);

    // Compute read status for each message
    const formattedMessages = await this.attachReadStatusToMessages(
      activeProperty.id,
      messages,
      residentsInfo
    );

    const pinnedMessages = formattedMessages.filter((m) => m.isPinned);

    return {
      hasAccess: true,
      currentUser: {
        id: userId,
        name: access.senderName,
        role: access.senderRole,
        unitNumber: access.senderUnitNumber || null,
      },
      property: activeProperty,
      availableProperties: accessibleProperties,
      residentsInfo,
      pinnedMessages,
      messages: formattedMessages,
    };
  }

  /**
   * Mark user has read messages in the property chat up to now
   */
  static async markUserRead(propertyId: string, userId: string): Promise<void> {
    try {
      const now = new Date();
      await prisma.propertyChatMemberRead.upsert({
        where: {
          propertyId_userId: {
            propertyId,
            userId,
          },
        },
        update: {
          lastReadAt: now,
        },
        create: {
          propertyId,
          userId,
          lastReadAt: now,
        },
      });
    } catch (err) {
      console.warn("markUserRead error:", err);
    }
  }

  /**
   * Attach read status (Ceklis 1, Ceklis 2 ga biru, Ceklis 2 biru) to messages
   */
  static async attachReadStatusToMessages(
    propertyId: string,
    messages: any[],
    residentsInfo?: any
  ) {
    const resInfo = residentsInfo || (await this.getPropertyResidents(propertyId));

    const residentUserIds = (resInfo.residents || [])
      .map((r: any) => r.userId)
      .filter(Boolean);
    const managerUserIds = (resInfo.managers || [])
      .map((m: any) => m.id)
      .filter(Boolean);

    const memberReads = await prisma.propertyChatMemberRead.findMany({
      where: { propertyId },
      select: {
        userId: true,
        lastReadAt: true,
      },
    });

    // Unique set of all known members
    const allMemberUserIds = Array.from(
      new Set([
        ...residentUserIds,
        ...managerUserIds,
        ...memberReads.map((mr) => mr.userId),
      ])
    );

    return messages.map((m) => {
      const otherMemberIds = allMemberUserIds.filter((id) => id !== m.senderId);
      const msgTime = new Date(m.createdAt).getTime();

      const readRecipients = memberReads.filter(
        (mr) => mr.userId !== m.senderId && new Date(mr.lastReadAt).getTime() >= msgTime
      );
      const readCount = readRecipients.length;
      const totalRecipients = Math.max(otherMemberIds.length, readCount);

      let readStatus: "SENT" | "DELIVERED" | "READ_ALL" = "SENT";
      if (totalRecipients > 0) {
        if (readCount >= totalRecipients) {
          readStatus = "READ_ALL"; // Ceklis 2 BIRU (Semua warga sudah membaca)
        } else if (readCount > 0) {
          readStatus = "DELIVERED"; // Ceklis 2 GA BIRU (Sebagian warga sudah membaca)
        } else {
          readStatus = "SENT"; // Ceklis 1 (Terkirim ke server, belum ada yang baca)
        }
      } else {
        readStatus = "SENT";
      }

      return {
        id: m.id,
        propertyId: m.propertyId,
        senderId: m.senderId,
        messageType: m.messageType,
        content: m.isDeleted ? "🚫 Pesan ini telah dihapus" : m.content,
        mediaUrl: m.mediaUrl,
        senderName: m.senderName || "Anonim",
        senderUnitNumber: m.senderUnitNumber,
        senderRole: m.senderRole || "WARGA",
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
        isPinned: Boolean(m.isPinned),
        pinnedAt: m.pinnedAt ? (m.pinnedAt instanceof Date ? m.pinnedAt.toISOString() : m.pinnedAt) : null,
        pinnedById: m.pinnedById || null,
        replyToId: m.replyToId || null,
        replyToContent: m.replyToContent || null,
        replyToSenderName: m.replyToSenderName || null,
        isDeleted: Boolean(m.isDeleted),
        deletedAt: m.deletedAt ? (m.deletedAt instanceof Date ? m.deletedAt.toISOString() : m.deletedAt) : null,
        readStatus,
        readCount,
        totalRecipients,
      };
    });
  }

  /**
   * Send a new regular chat message to the Kost Group Chat
   */
  static async sendMessage(params: SendMessageParams) {
    const { userId, role, propertyId, content, mediaUrl, replyToId, replyToContent, replyToSenderName } = params;

    if (!content || !content.trim()) {
      throw new Error("Pesan tidak boleh kosong.");
    }

    const access = await this.verifyPropertyAccess(userId, role, propertyId);
    if (!access.allowed) {
      throw new Error(access.reason || "Akses ditolak.");
    }

    const message = await prisma.propertyChatMessage.create({
      data: {
        propertyId,
        senderId: userId,
        messageType: MessageType.CHAT,
        content: content.trim(),
        mediaUrl: mediaUrl || null,
        senderName: access.senderName,
        senderUnitNumber: access.senderUnitNumber || null,
        senderRole: access.senderRole,
        replyToId: replyToId || null,
        replyToContent: replyToContent || null,
        replyToSenderName: replyToSenderName || null,
      },
    });

    return {
      id: message.id,
      propertyId: message.propertyId,
      senderId: message.senderId,
      messageType: message.messageType,
      content: message.content,
      mediaUrl: message.mediaUrl,
      senderName: message.senderName,
      senderUnitNumber: message.senderUnitNumber,
      senderRole: message.senderRole,
      replyToId: message.replyToId,
      replyToContent: message.replyToContent,
      replyToSenderName: message.replyToSenderName,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt.toISOString(),
    };
  }

  /**
   * Automatically create a SYSTEM_JOIN message when a tenant checks in / is assigned to a unit
   */
  static async sendSystemJoinMessage(params: {
    propertyId: string;
    tenantName: string;
    unitNumber: string;
    tenantUserId?: string | null;
  }) {
    try {
      const { propertyId, tenantName, unitNumber, tenantUserId } = params;
      if (!propertyId || !tenantName || !unitNumber) return null;

      const cleanName = tenantName.trim();
      const cleanUnit = unitNumber.trim();
      const content = `🎉 ${cleanName} (Kamar ${cleanUnit}) telah bergabung ke grup kost. Yuk sapa tetangga barumu!`;

      return await prisma.propertyChatMessage.create({
        data: {
          propertyId,
          senderId: tenantUserId || null,
          messageType: MessageType.SYSTEM_JOIN,
          content,
          senderName: cleanName,
          senderUnitNumber: cleanUnit,
          senderRole: "TENANT",
        },
      });
    } catch (err) {
      console.error("Failed to send SYSTEM_JOIN chat message:", err);
      return null;
    }
  }

  /**
   * Automatically create a SYSTEM_LEAVE message when a tenant checks out / lease terminates
   */
  static async sendSystemLeaveMessage(params: {
    propertyId: string;
    tenantName: string;
    unitNumber: string;
    tenantUserId?: string | null;
  }) {
    try {
      const { propertyId, tenantName, unitNumber, tenantUserId } = params;
      if (!propertyId || !tenantName || !unitNumber) return null;

      const cleanName = tenantName.trim();
      const cleanUnit = unitNumber.trim();
      const content = `👋 ${cleanName} (Kamar ${cleanUnit}) telah menyelesaikan masa sewa dan keluar dari grup kost.`;

      return await prisma.propertyChatMessage.create({
        data: {
          propertyId,
          senderId: tenantUserId || null,
          messageType: MessageType.SYSTEM_LEAVE,
          content,
          senderName: cleanName,
          senderUnitNumber: cleanUnit,
          senderRole: "TENANT",
        },
      });
    } catch (err) {
      console.error("Failed to send SYSTEM_LEAVE chat message:", err);
      return null;
    }
  }

  /**
   * Send an official broadcast ANNOUNCEMENT message to the Kost Group Chat
   */
  static async sendAnnouncementMessage(params: {
    propertyId: string;
    title: string;
    content: string;
    senderId?: string | null;
    senderName?: string;
  }) {
    try {
      const { propertyId, title, content, senderId, senderName } = params;
      if (!propertyId || !title || !content) return null;

      const formattedContent = `📢 PENGUMUMAN RESMI: ${title.trim()}\n\n${content.trim()}`;

      return await prisma.propertyChatMessage.create({
        data: {
          propertyId,
          senderId: senderId || null,
          messageType: MessageType.ANNOUNCEMENT,
          content: formattedContent,
          senderName: senderName || "Pengelola Kost",
          senderRole: "OWNER",
        },
      });
    } catch (err) {
      console.error("Failed to send ANNOUNCEMENT chat message:", err);
      return null;
    }
  }

  /**
   * Pin a message (Owner / Housekeeping only)
   */
  static async pinMessage(
    propertyId: string,
    messageId: string,
    userId: string,
    role: string
  ) {
    const access = await this.verifyPropertyAccess(userId, role, propertyId);
    if (!access.allowed) {
      throw new Error(access.reason || "Akses ditolak.");
    }

    const updated = await prisma.propertyChatMessage.update({
      where: { id: messageId },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
        pinnedById: userId,
      },
    });

    return updated;
  }

  /**
   * Unpin a message
   */
  static async unpinMessage(
    propertyId: string,
    messageId: string,
    userId: string,
    role: string
  ) {
    const access = await this.verifyPropertyAccess(userId, role, propertyId);
    if (!access.allowed) {
      throw new Error(access.reason || "Akses ditolak.");
    }

    const updated = await prisma.propertyChatMessage.update({
      where: { id: messageId },
      data: {
        isPinned: false,
        pinnedAt: null,
        pinnedById: null,
      },
    });

    return updated;
  }

  /**
   * Delete a chat message (soft delete: "🚫 Pesan ini telah dihapus")
   * Senders can delete their own message; Admins (Owner/Housekeeping) can delete any message.
   */
  static async deleteMessage(
    propertyId: string,
    messageId: string,
    userId: string,
    role: string
  ) {
    const access = await this.verifyPropertyAccess(userId, role, propertyId);
    if (!access.allowed) {
      throw new Error(access.reason || "Akses ditolak.");
    }

    const message = await prisma.propertyChatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.propertyId !== propertyId) {
      throw new Error("Pesan tidak ditemukan.");
    }

    const isAdmin =
      role === UserRole.OWNER ||
      role === UserRole.HOUSEKEEPING ||
      role === UserRole.PLATFORM_ADMIN;

    const isSender = message.senderId === userId;

    if (!isSender && !isAdmin) {
      throw new Error("Anda hanya dapat menghapus pesan yang Anda kirim sendiri.");
    }

    const updated = await prisma.propertyChatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: "🚫 Pesan ini telah dihapus",
        isPinned: false, // Automatically unpin if deleted
      },
    });

    return updated;
  }

  /**
   * Get all pinned messages for a property
   */
  static async getPinnedMessages(propertyId: string) {
    return await prisma.propertyChatMessage.findMany({
      where: {
        propertyId,
        isPinned: true,
      },
      orderBy: { pinnedAt: "desc" },
    });
  }

  /**
   * Get comprehensive community history (Resident logs, Official announcements, Pinned archive, & Community stats)
   */
  static async getCommunityHistory(
    userId: string,
    role: string,
    requestedPropertyId?: string,
    search?: string
  ) {
    const accessibleProperties = await this.getUserAccessibleProperties(userId, role);
    if (accessibleProperties.length === 0) {
      return {
        hasAccess: false,
        error: "Tidak ada properti aktif yang dapat Anda akses.",
        availableProperties: [],
        property: null,
        stats: {
          totalMessages: 0,
          activeResidents: 0,
          managersCount: 0,
          totalAnnouncements: 0,
          pinnedCount: 0,
          totalEvents: 0,
        },
        residentLogs: [],
        announcements: [],
        pinnedArchive: [],
      };
    }

    let activeProperty = requestedPropertyId
      ? accessibleProperties.find((p) => p.id === requestedPropertyId)
      : accessibleProperties[0];

    if (!activeProperty) activeProperty = accessibleProperties[0];

    const access = await this.verifyPropertyAccess(userId, role, activeProperty.id);
    if (!access.allowed) {
      return {
        hasAccess: false,
        error: access.reason || "Akses ditolak.",
        availableProperties: accessibleProperties,
        property: activeProperty,
        stats: {
          totalMessages: 0,
          activeResidents: 0,
          managersCount: 0,
          totalAnnouncements: 0,
          pinnedCount: 0,
          totalEvents: 0,
        },
        residentLogs: [],
        announcements: [],
        pinnedArchive: [],
      };
    }

    // 1. Resident logs (SYSTEM_JOIN and SYSTEM_LEAVE)
    const residentLogs = await prisma.propertyChatMessage.findMany({
      where: {
        propertyId: activeProperty.id,
        messageType: { in: [MessageType.SYSTEM_JOIN, MessageType.SYSTEM_LEAVE] },
        ...(search
          ? {
              OR: [
                { content: { contains: search, mode: "insensitive" } },
                { senderName: { contains: search, mode: "insensitive" } },
                { senderUnitNumber: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 2. Official announcements archive
    const [chatAnnouncements, officialAnnouncements] = await Promise.all([
      prisma.propertyChatMessage.findMany({
        where: {
          propertyId: activeProperty.id,
          messageType: MessageType.ANNOUNCEMENT,
          ...(search ? { content: { contains: search, mode: "insensitive" } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.announcement.findMany({
        where: {
          propertyId: activeProperty.id,
          ...(search
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { content: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          createdBy: {
            select: {
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    // 3. Pinned messages archive
    const pinnedArchive = await prisma.propertyChatMessage.findMany({
      where: {
        propertyId: activeProperty.id,
        isPinned: true,
        ...(search ? { content: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: { pinnedAt: "desc" },
      take: 50,
    });

    // 4. Aggregated stats
    const [totalMessages, residentsInfo] = await Promise.all([
      prisma.propertyChatMessage.count({
        where: { propertyId: activeProperty.id },
      }),
      this.getPropertyResidents(activeProperty.id),
    ]);

    return {
      hasAccess: true,
      property: activeProperty,
      availableProperties: accessibleProperties,
      stats: {
        totalMessages,
        activeResidents: residentsInfo.activeResidentsCount,
        managersCount: residentsInfo.managersCount,
        totalAnnouncements: officialAnnouncements.length + chatAnnouncements.length,
        pinnedCount: pinnedArchive.length,
        totalEvents: residentLogs.length,
      },
      residentLogs: residentLogs.map((l) => ({
        id: l.id,
        eventType: l.messageType === MessageType.SYSTEM_JOIN ? "JOIN" : "LEAVE",
        content: l.content,
        senderName: l.senderName || "Warga Kost",
        senderUnitNumber: l.senderUnitNumber,
        timestamp: l.createdAt.toISOString(),
      })),
      announcements: [
        ...officialAnnouncements.map((a: any) => ({
          id: a.id,
          source: "OFFICIAL",
          title: a.title,
          content: a.content,
          authorName: a.createdBy?.fullName || "Pengelola",
          authorRole: a.createdBy?.role || "MANAGEMENT",
          isPinned: a.isPinned || false,
          category: "OFFICIAL",
          createdAt: a.createdAt.toISOString(),
        })),
        ...chatAnnouncements.map((c) => ({
          id: c.id,
          source: "CHAT_ANNOUNCEMENT",
          title: "Pengumuman Warga Kost",
          content: c.content,
          authorName: c.senderName || "Pengelola",
          authorRole: c.senderRole || "MANAGEMENT",
          isPinned: c.isPinned || false,
          category: "GENERAL",
          createdAt: c.createdAt.toISOString(),
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      pinnedArchive: pinnedArchive.map((p) => ({
        id: p.id,
        content: p.content,
        senderName: p.senderName || "Pengelola",
        senderRole: p.senderRole || "WARGA",
        senderUnitNumber: p.senderUnitNumber,
        pinnedAt: p.pinnedAt ? p.pinnedAt.toISOString() : p.createdAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }
}

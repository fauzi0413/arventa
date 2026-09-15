import { prisma } from "@/lib/prisma";
import { serializeForumContent } from "@/lib/forum-helper";
import { UserRole } from "@/generated/prisma/client";

export interface WelcomePostInput {
  propertyId: string;
  unitNumber: string;
  tenantName: string;
  checkInDate?: string | Date;
}

export class CommunityWelcomeService {
  /**
   * Automatically creates a welcome post for a new tenant checking into a unit
   */
  static async createWelcomePost(input: WelcomePostInput) {
    try {
      const { propertyId, unitNumber, tenantName } = input;
      if (!propertyId || !tenantName?.trim() || !unitNumber?.trim()) return null;

      const cleanName = tenantName.trim();
      const cleanUnit = unitNumber.trim();

      // Check if welcome post already exists for this tenant & unit in this property
      const existing = await prisma.forumPost.findFirst({
        where: {
          propertyId,
          title: {
            contains: `Selamat Datang Penghuni Baru: ${cleanName} di Kamar ${cleanUnit}`,
            mode: "insensitive",
          },
        },
      });

      if (existing) {
        return existing;
      }

      // Find an author for system post: property owner or first admin/owner user
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, name: true, ownerId: true },
      });

      let authorId = property?.ownerId;
      if (!authorId) {
        const ownerUser = await prisma.user.findFirst({
          where: { role: { in: [UserRole.OWNER, UserRole.PLATFORM_ADMIN] } },
          select: { id: true },
        });
        authorId = ownerUser?.id;
      }

      if (!authorId) {
        const anyUser = await prisma.user.findFirst({ select: { id: true } });
        authorId = anyUser?.id;
      }

      if (!authorId) {
        console.warn("Cannot create welcome post: No author user found in database.");
        return null;
      }

      const postTitle = `🎉 Selamat Datang Penghuni Baru: ${cleanName} di Kamar ${cleanUnit}!`;
      const postBody = `🎉 Selamat datang penghuni baru: ${cleanName} di Kamar ${cleanUnit}! Yuk sapa tetangga barumu dan kenalan di kolom komentar!`;

      const serializedContent = serializeForumContent({
        content: postBody,
        category: "SAMBUTAN",
        status: "OPEN",
      });

      const post = await prisma.forumPost.create({
        data: {
          propertyId,
          authorId,
          title: postTitle,
          content: serializedContent,
        },
      });

      return post;
    } catch (err) {
      console.error("Failed to create automatic community welcome post:", err);
      return null;
    }
  }
}

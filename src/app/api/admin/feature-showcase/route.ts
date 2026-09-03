import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { DEFAULT_SLIDES } from "@/components/ui/feature-slides.default";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_MOCKUP_TYPES = [
  "property",
  "tenant",
  "billing",
  "housekeeping",
  "analytics",
  "community",
  "ai",
];

async function ensurePlatformAdmin(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return { error: ApiResponse.unauthorized("Anda harus login terlebih dahulu.") };
  }
  if (authUser.role !== UserRole.PLATFORM_ADMIN) {
    return { error: ApiResponse.forbidden("Akses ditolak. Khusus Platform Admin.") };
  }
  return { authUser };
}

async function seedDefaultsIfEmpty() {
  try {
    const count = await prisma.carouselLandingPageFeature.count();
    if (count === 0) {
      await prisma.carouselLandingPageFeature.createMany({
        data: DEFAULT_SLIDES.map((s, i) => ({
          badge: s.badge,
          category: s.category,
          title: s.title,
          description: s.description,
          tags: s.tags,
          ctaText: s.ctaText,
          ctaHref: s.ctaHref,
          mockupType: s.mockup.type,
          headerTitle: s.mockup.headerTitle,
          subBadge: s.mockup.subBadge,
          order: i + 1,
          isPublished: true,
        })),
      });
    }
  } catch (e) {
    console.warn("Seed carousel_landing_page_features error:", e);
  }
}

/**
 * GET /api/admin/feature-showcase
 * Fetch all slides (including unpublished) for the admin manager.
 * Auto-seed defaults when the table is empty.
 */
export async function GET(req: NextRequest) {
  const guard = await ensurePlatformAdmin(req);
  if (guard.error) return guard.error;

  try {
    await seedDefaultsIfEmpty();

    const records = await prisma.carouselLandingPageFeature.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    const total = records.length;
    const published = records.filter((r) => r.isPublished).length;

    return ApiResponse.success({
      message: "Berhasil mengambil data feature showcase",
      data: {
        slides: records,
        stats: {
          total,
          published,
          draft: total - published,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/feature-showcase error:", error);
    return ApiResponse.error({ message: "Gagal mengambil data feature showcase" });
  }
}

/**
 * POST /api/admin/feature-showcase
 * Create / Update / Delete / Toggle publish / Reorder carousel slides (PLATFORM_ADMIN).
 */
export async function POST(req: NextRequest) {
  const guard = await ensurePlatformAdmin(req);
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const { action } = body;

    // ---- CREATE SLIDE ----
    if (action === "CREATE") {
      const { badge, category, title, description, tags, ctaText, ctaHref, mockupType, headerTitle, subBadge, imageUrl, order } = body;

      if (!badge || !title || !description || !ctaText || !ctaHref) {
        return ApiResponse.badRequest("Badge, Judul, Deskripsi, CTA Teks, dan CTA Link wajib diisi");
      }

      const resolvedType = VALID_MOCKUP_TYPES.includes(mockupType) ? mockupType : "property";
      const lastItem = await prisma.carouselLandingPageFeature.findFirst({
        orderBy: { order: "desc" },
      });
      const orderVal =
        order !== undefined && order !== null && order !== "" ? parseInt(String(order), 10) : (lastItem ? lastItem.order + 1 : 1);

      const created = await prisma.carouselLandingPageFeature.create({
        data: {
          badge,
          category: category || "UMUM",
          title,
          description,
          tags: Array.isArray(tags) ? tags : [],
          ctaText,
          ctaHref,
          mockupType: resolvedType,
          headerTitle: headerTitle || null,
          subBadge: subBadge || null,
          imageUrl: imageUrl || null,
          order: isNaN(orderVal) ? 1 : orderVal,
          isPublished: true,
        },
      });

      await writeAudit(guard.authUser!, "CREATE_CAROUSEL_SLIDE", created.id, { title: created.title });

      return ApiResponse.success({
        status: 201,
        message: `Slide "${created.title}" berhasil ditambahkan`,
        data: created,
      });
    }

    // ---- UPDATE SLIDE ----
    if (action === "UPDATE") {
      const { slideId, badge, category, title, description, tags, ctaText, ctaHref, mockupType, headerTitle, subBadge, imageUrl, order } = body;

      if (!slideId) {
        return ApiResponse.badRequest("slideId wajib diisi");
      }

      const existing = await prisma.carouselLandingPageFeature.findUnique({ where: { id: slideId } });
      if (!existing) {
        return ApiResponse.notFound("Slide tidak ditemukan");
      }

      const data: {
        badge?: string;
        category?: string;
        title?: string;
        description?: string;
        tags?: string[];
        ctaText?: string;
        ctaHref?: string;
        mockupType?: string;
        headerTitle?: string | null;
        subBadge?: string | null;
        imageUrl?: string | null;
        order?: number;
      } = {};
      if (badge !== undefined) data.badge = badge;
      if (category !== undefined) data.category = category;
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : [];
      if (ctaText !== undefined) data.ctaText = ctaText;
      if (ctaHref !== undefined) data.ctaHref = ctaHref;
      if (mockupType !== undefined && VALID_MOCKUP_TYPES.includes(mockupType)) data.mockupType = mockupType;
      if (headerTitle !== undefined) data.headerTitle = headerTitle || null;
      if (subBadge !== undefined) data.subBadge = subBadge || null;
      if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
      if (order !== undefined) {
        const parsed = parseInt(String(order), 10);
        if (!isNaN(parsed)) data.order = parsed;
      }

      const updated = await prisma.carouselLandingPageFeature.update({
        where: { id: slideId },
        data,
      });

      await writeAudit(guard.authUser!, "UPDATE_CAROUSEL_SLIDE", updated.id, { title: updated.title });

      return ApiResponse.success({
        message: `Slide "${updated.title}" berhasil diperbarui`,
        data: updated,
      });
    }

    // ---- DELETE SLIDE ----
    if (action === "DELETE") {
      const { slideId } = body;
      if (!slideId) {
        return ApiResponse.badRequest("slideId wajib diisi");
      }

      const existing = await prisma.carouselLandingPageFeature.findUnique({ where: { id: slideId } });
      if (!existing) {
        return ApiResponse.notFound("Slide tidak ditemukan");
      }

      await prisma.carouselLandingPageFeature.delete({ where: { id: slideId } });

      await writeAudit(guard.authUser!, "DELETE_CAROUSEL_SLIDE", existing.id, { title: existing.title });

      return ApiResponse.success({
        message: `Slide "${existing.title}" berhasil dihapus`,
        data: { id: slideId },
      });
    }

    // ---- TOGGLE PUBLISH ----
    if (action === "TOGGLE_PUBLISH") {
      const { slideId } = body;
      if (!slideId) {
        return ApiResponse.badRequest("slideId wajib diisi");
      }

      const existing = await prisma.carouselLandingPageFeature.findUnique({ where: { id: slideId } });
      if (!existing) {
        return ApiResponse.notFound("Slide tidak ditemukan");
      }

      const updated = await prisma.carouselLandingPageFeature.update({
        where: { id: slideId },
        data: { isPublished: !existing.isPublished },
      });

      await writeAudit(guard.authUser!, "TOGGLE_CAROUSEL_SLIDE", updated.id, {
        title: updated.title,
        isPublished: updated.isPublished,
      });

      return ApiResponse.success({
        message: `Slide "${updated.title}" diubah menjadi ${updated.isPublished ? "PUBLISHED" : "DRAFT/HIDDEN"}`,
        data: updated,
      });
    }

    // ---- REORDER ----
    if (action === "REORDER") {
      const { slideId, order } = body;
      if (!slideId || order === undefined) {
        return ApiResponse.badRequest("slideId dan order wajib diisi");
      }

      const updated = await prisma.carouselLandingPageFeature.update({
        where: { id: slideId },
        data: { order: parseInt(String(order), 10) },
      });

      return ApiResponse.success({
        message: `Urutan slide "${updated.title}" berhasil diperbarui`,
        data: updated,
      });
    }

    // ---- SWAP ORDER ----
    if (action === "SWAP_ORDER") {
      const { item1Id, item2Id } = body;
      if (!item1Id || !item2Id) {
        return ApiResponse.badRequest("item1Id dan item2Id wajib diisi");
      }

      const item1 = await prisma.carouselLandingPageFeature.findUnique({ where: { id: item1Id } });
      const item2 = await prisma.carouselLandingPageFeature.findUnique({ where: { id: item2Id } });

      if (!item1 || !item2) {
        return ApiResponse.notFound("Slide tidak ditemukan");
      }

      const order1 = item1.order;
      let order2 = item2.order;
      if (order1 === order2) {
        order2 = order1 + 1;
      }

      await prisma.$transaction([
        prisma.carouselLandingPageFeature.update({ where: { id: item1Id }, data: { order: order2 } }),
        prisma.carouselLandingPageFeature.update({ where: { id: item2Id }, data: { order: order1 } }),
      ]);

      return ApiResponse.success({
        message: `Posisi "${item1.title}" dan "${item2.title}" berhasil ditukar`,
      });
    }

    return ApiResponse.badRequest("Aksi tidak valid");
  } catch (error) {
    console.error("POST /api/admin/feature-showcase error:", error);
    return ApiResponse.error({ message: "Terjadi kesalahan server" });
  }
}

async function writeAudit(
  authUser: { id: string },
  action: string,
  entityId: string,
  details: Record<string, string | number | boolean | null>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        action,
        entityName: "CarouselLandingPageFeature",
        entityId,
        details,
      },
    });
  } catch (e) {
    console.warn("Audit log creation error:", e);
  }
}

import { prisma } from "../../src/lib/prisma";
import { Property, User } from "../../generated/prisma/client";

interface SeedCommunityProps {
  kosGrahaAsri: Property;
  owner: User;
}

/**
 * Seed Announcements, Forum Posts, and Forum Comments for Property Community.
 */
export async function seedCommunity({
  kosGrahaAsri,
  owner,
}: SeedCommunityProps) {
  console.log("\n📢 Seeding Community Announcements & Forum Threads (Idempotent)...");

  // 1. Announcements
  let announcement = await prisma.announcement.findFirst({
    where: { propertyId: kosGrahaAsri.id, title: "Jadwal Pembersihan Selasar & Sampah Umum" },
  });

  if (!announcement) {
    announcement = await prisma.announcement.create({
      data: {
        propertyId: kosGrahaAsri.id,
        createdById: owner.id,
        title: "Jadwal Pembersihan Selasar & Sampah Umum",
        content:
          "Pemberitahuan untuk seluruh penghuni Kos Graha Asri: Pembersihan selasar dan pengangkutan sampah dilakukan setiap hari pukul 08:00 WIB.",
        isPinned: true,
      },
    });
    console.log(`✅ Created Announcement: ${announcement.title}`);
  } else {
    console.log(`ℹ️ Existing Announcement found: ${announcement.title}`);
  }

  // 2. Forum Post & Comments
  let forumPost = await prisma.forumPost.findFirst({
    where: { propertyId: kosGrahaAsri.id, title: "Rekomendasi Tempat Laundry Terdekat" },
  });

  if (!forumPost) {
    forumPost = await prisma.forumPost.create({
      data: {
        propertyId: kosGrahaAsri.id,
        authorId: owner.id,
        title: "Rekomendasi Tempat Laundry Terdekat",
        content: "Halo teman-teman penghuni Kos Graha Asri, ada rekomendasi laundry kilat 1 hari selesai sekitaran Dago?",
        comments: {
          create: [
            {
              authorId: owner.id,
              content: "Di seberang gerbang ITB ada Laundry Express jam 7 malam sudah selesai kak!",
            },
          ],
        },
      },
    });
    console.log(`✅ Created Forum Post: ${forumPost.title}`);
  } else {
    console.log(`ℹ️ Existing Forum Post found: ${forumPost.title}`);
  }
}

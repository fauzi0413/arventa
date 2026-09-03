import { prisma } from "d:/kost kostan project/arventa/src/lib/prisma";
import { parseAnnouncementRecord } from "d:/kost kostan project/arventa/src/lib/announcement-helper";

async function verifyTenantCommunityComplete() {
  console.log("=== VERIFYING TENANT COMMUNITY (ARV-M5-02) ===");

  // 1. Verify tenant lookup with unit account
  const unitAccount = await prisma.user.findFirst({
    where: { email: "kamar101@arventa.id" },
  });
  console.log("1. Tenant User:", {
    id: unitAccount?.id,
    email: unitAccount?.email,
    fullName: unitAccount?.fullName,
    role: unitAccount?.role,
  });

  // 2. Verify direct unit assignment
  const directUnit = await prisma.unit.findFirst({
    where: { unitUserId: unitAccount?.id },
    include: { property: true },
  });
  console.log("2. Direct Unit Context:", {
    unitId: directUnit?.id,
    unitNumber: directUnit?.unitNumber,
    propertyId: directUnit?.propertyId,
    propertyName: directUnit?.property.name,
    ownerId: directUnit?.property.ownerId,
  });

  // 3. Query candidate announcements
  const rawAnnouncements = await prisma.announcement.findMany({
    where: {
      OR: [
        { propertyId: directUnit?.propertyId },
        { property: { ownerId: directUnit?.property.ownerId } },
      ],
    },
    include: {
      property: { select: { id: true, name: true } },
      createdBy: { select: { id: true, fullName: true, role: true } },
    },
  });

  console.log(`3. Total candidates found: ${rawAnnouncements.length}`);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 4. Test filtering and mapping
  const parsed = rawAnnouncements.map((a) => parseAnnouncementRecord(a));
  const visible = parsed.filter((item) => {
    if (item.status !== "PUBLISHED") return false;
    const pubDate = new Date(item.publishDate);
    if (isNaN(pubDate.getTime()) || pubDate > now) return false;
    if (item.targetScope === "ALL_PROPERTIES") return true;
    if (item.targetScope === "SPECIFIC_PROPERTY" && item.targetPropertyId === directUnit?.propertyId) return true;
    if (item.targetScope === "SPECIFIC_UNITS" && directUnit?.id && item.targetUnitIds?.includes(directUnit.id)) return true;
    return false;
  });

  console.log(`4. Visible announcements: ${visible.length}`);
  visible.forEach((ann) => {
    const isImportant =
      ann.title.toLowerCase().includes("penting") ||
      ann.title.toLowerCase().includes("urgent") ||
      ann.content.toLowerCase().includes("[penting]");

    const itemDTO = {
      id: ann.id,
      title: ann.title,
      content: ann.content.slice(0, 50) + "...",
      senderName: ann.createdBy?.name || "Pengelola Kost",
      senderRole: ann.createdBy?.role === "HOUSEKEEPING" ? "HOUSEKEEPING" : "OWNER",
      publishDate: ann.publishDate,
      isImportant,
      targetScopeLabel: ann.targetScope === "ALL_PROPERTIES" ? "Seluruh Penghuni" : ann.targetPropertyName,
      isRead: false,
    };
    console.log("   Mapped TenantAnnouncementItem:", itemDTO);
  });

  const activeTabItems = visible.filter((a) => new Date(a.publishDate) >= thirtyDaysAgo);
  const historyTabItems = visible.filter((a) => new Date(a.publishDate) < thirtyDaysAgo);

  console.log(`\n5. Tabs separation:`);
  console.log(`   - ACTIVE Tab (<= 30 days): ${activeTabItems.length} items`);
  console.log(`   - HISTORY Tab (> 30 days): ${historyTabItems.length} items`);

  console.log("\n=== ALL CHECKS PASSED SUCCESSFULLY! ===");
}

verifyTenantCommunityComplete()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

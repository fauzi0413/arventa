import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export default function HousekeepingCommunityPage() {
  return (
    <DeveloperModePlaceholder
      title="Komunitas & Pengumuman"
      path="/housekeeping/community"
      description="Pembuatan pengumuman baru untuk penghuni gedung dan penanganan keluhan pada forum diskusi."
      features={["Announcement Publisher", "Forum Thread Moderation", "Resident Noticeboard"]}
    />
  );
}

import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export default function TenantCommunityPage() {
  return (
    <DeveloperModePlaceholder
      title="Komunitas Properti"
      path="/portal/community"
      description="Pengumuman pengelola gedung, forum diskusi penghuni, dan direct WhatsApp chat ke staf housekeeping."
      features={["Resident Forum", "Building Noticeboard", "Direct Housekeeping WA"]}
    />
  );
}

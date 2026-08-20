import { FaqManagementManager } from "@/components/admin/faq-management-manager";

export const metadata = {
  title: "FAQ Management & Help Center | ARVENTA SaaS Platform",
  description: "Kelola daftar pertanyaan umum (FAQ), petunjuk operasional sistem, dan pusat bantuan platform ARVENTA.",
};

export default function PlatformFaqPage() {
  return <FaqManagementManager />;
}

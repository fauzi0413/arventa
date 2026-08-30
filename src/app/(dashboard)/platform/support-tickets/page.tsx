import { SupportTicketManager } from "@/components/admin/support-ticket-manager";

export const metadata = {
  title: "Tiket Management Laporan Support | ARVENTA SaaS Platform",
  description: "Pusat penanganan tiket laporan support, kendala teknis, dan pertanyaan billing pengirim platform ARVENTA.",
};

export default function PlatformSupportTicketsPage() {
  return <SupportTicketManager />;
}

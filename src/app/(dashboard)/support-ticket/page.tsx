import { Metadata } from "next";
import { SupportTicketFormView } from "@/components/support/support-ticket-form-view";

export const metadata: Metadata = {
  title: "Pusat Bantuan & Lapor Kendala | ARVENTA",
  description: "Layanan pengaduan kendala teknis, billing, dan pertanyaan penggunaan platform ARVENTA.",
};

export default function SupportTicketPage() {
  return <SupportTicketFormView />;
}

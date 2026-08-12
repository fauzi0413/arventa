import type { Metadata } from "next";
import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export const metadata: Metadata = {
  title: "Tagihan & Pembayaran",
  description: "Riwayat invoice bulanan, status verifikasi bukti transfer, dan download kuitansi pembayaran digital PDF.",
};

export default function TenantInvoicesPage() {
  return (
    <DeveloperModePlaceholder
      title="Tagihan & Pembayaran"
      path="/portal/invoices"
      description="Riwayat invoice bulanan, status verifikasi bukti transfer, dan download kuitansi pembayaran digital PDF."
      features={["Invoice History", "Payment Receipt Upload", "Digital Kuitansi PDF"]}
    />
  );
}

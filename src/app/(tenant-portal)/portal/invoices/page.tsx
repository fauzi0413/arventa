import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

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

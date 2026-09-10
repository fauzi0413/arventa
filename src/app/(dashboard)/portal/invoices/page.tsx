import type { Metadata } from "next";
import { TenantInvoicesView } from "@/components/portal/tenant-invoices-view";

export const metadata: Metadata = {
  title: "Tagihan & Pembayaran | ARVENTA",
  description: "Riwayat invoice bulanan, status verifikasi bukti transfer, dan download kuitansi pembayaran digital PDF.",
};

export default function TenantInvoicesPage() {
  return <TenantInvoicesView />;
}

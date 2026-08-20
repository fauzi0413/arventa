import { SaasInvoiceManager } from "@/components/admin/saas-invoice-manager";

export const metadata = {
  title: "Tagihan & SaaS Invoice | ARVENTA Admin",
  description: "Manajemen tagihan invoice langganan SaaS, verifikasi pembayaran, dan cetak kwitansi resmi.",
};

export default function PlatformSaasInvoicePage() {
  return <SaasInvoiceManager />;
}

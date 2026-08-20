import { SaasPaymentMethodsManager } from "@/components/admin/saas-payment-methods-manager";

export const metadata = {
  title: "Rekening Pembayaran SaaS | ARVENTA Admin",
  description: "Pengaturan nomor rekening bank resmi dan QRIS merchant tujuan transfer pembayaran langganan SaaS oleh owner properti.",
};

export default function PlatformPaymentMethodsPage() {
  return <SaasPaymentMethodsManager />;
}

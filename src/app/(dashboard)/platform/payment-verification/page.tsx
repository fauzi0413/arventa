import { PaymentVerificationManager } from "@/components/admin/payment-verification-manager";

export const metadata = {
  title: "Verifikasi Pembayaran | ARVENTA Admin",
  description: "Audit dan verifikasi bukti transfer pembayaran SaaS dari owner properti.",
};

export default function PlatformPaymentVerificationPage() {
  return <PaymentVerificationManager />;
}

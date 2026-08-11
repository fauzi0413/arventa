import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export default function PlatformSubscriptionsPage() {
  return (
    <DeveloperModePlaceholder
      title="Subscriptions & Billing"
      path="/platform/subscriptions"
      description="Pengaturan paket langganan SaaS (Tier Basic, Business, Pro) dan verifikasi invoice pembayaran owner."
      features={["SaaS Tier Limits", "Transaction History", "Invoice Verification"]}
    />
  );
}

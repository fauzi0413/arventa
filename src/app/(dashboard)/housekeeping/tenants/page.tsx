import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export default function HousekeepingTenantsPage() {
  return (
    <DeveloperModePlaceholder
      title="Data Penghuni Lapangan"
      path="/housekeeping/tenants"
      description="Daftar kontak penghuni di unit kamar tugas Anda, Fast Check-In lapangan, dan direct WhatsApp communication."
      features={["Direct WA Chat", "Fast Check-In", "Unit Contact Directory"]}
    />
  );
}

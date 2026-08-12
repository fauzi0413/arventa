import type { Metadata } from "next";
import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export const metadata: Metadata = {
  title: "Status Kamar Grid & Kredensial",
  description: "Pantau status kebersihan kamar, inventaris perabotan, dan akses kredensial unit lapangan.",
};

export default function HousekeepingRoomGridPage() {
  return (
    <DeveloperModePlaceholder
      title="Status Kamar Grid & Akses Kredensial"
      path="/housekeeping/room-grid"
      description="Visualisasi grid status kebersihan kamar (Perlu Dibersihkan, Maintenance, Siap Huni) serta manajemen akses WiFi & kunci digital unit lapangan."
      features={[
        "Real-time Room Status Grid",
        "WiFi & Smart Lock Credential Generator",
        "Fast Cleaning Status Switcher",
      ]}
    />
  );
}

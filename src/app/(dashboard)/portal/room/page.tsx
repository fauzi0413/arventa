import type { Metadata } from "next";
import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export const metadata: Metadata = {
  title: "Info Kamar Saya",
  description: "Informasi unit kamar, status sewa, dan fasilitas penghuni.",
};

export default function PortalRoomPage() {
  return (
    <DeveloperModePlaceholder
      title="Info Kamar & Fasilitas Saya"
      path="/portal/room"
      description="Informasi lengkap mengenai unit kamar yang Anda sewa, fasilitas kamar, password WiFi, serta instruksi penggunaan aset unit."
      features={[
        "Unit Specs & Inventory Details",
        "WiFi & Smart Lock Credentials",
        "House Rules & Facility Guidelines",
      ]}
    />
  );
}

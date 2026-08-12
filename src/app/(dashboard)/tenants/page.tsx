import type { Metadata } from "next";
import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export const metadata: Metadata = {
  title: "Penyewa & Kontrak Sewa",
  description: "Kelola data penyewa, profil NIK/KTP, dan status kontrak aktif.",
};

// ---------------------------------------------------------------------------
// Tenants Page — /tenants
// ---------------------------------------------------------------------------

export default function TenantsPage() {
  return (
    <DeveloperModePlaceholder
      title="Penyewa & Kontrak Sewa"
      path="/tenants"
      description="Manajemen data penyewa, verifikasi profil & foto KTP, status kontrak aktif, serta riwayat penyewaan unit properti."
      features={[
        "Tenant REST API Active (/api/tenants)",
        "Verifikasi Profil & NIK KTP",
        "Manajemen Kontrak & Invoice",
      ]}
    />
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Penyewa",
  description: "Kelola data penyewa dan kontrak sewa.",
};

// ---------------------------------------------------------------------------
// Tenants Page — /tenants
// ---------------------------------------------------------------------------

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Penyewa</h1>
          <p className="text-muted-foreground">
            Data penyewa, profil KTP, dan status kontrak aktif.
          </p>
        </div>
        {/* TODO: Add tenant button */}
      </div>

      {/* TODO: Tenant table with search, filter by property */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-center text-sm text-muted-foreground">
          Belum ada data penyewa terdaftar.
        </p>
      </div>
    </div>
  );
}

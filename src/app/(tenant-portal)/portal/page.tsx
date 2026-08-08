import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Penyewa",
  description: "Portal khusus penyewa untuk melihat tagihan, kontrak, dan mengajukan laporan.",
};

// ---------------------------------------------------------------------------
// Tenant Portal — /portal
// ---------------------------------------------------------------------------
// This is a separate route group for tenant-facing features.
// Uses a different layout from the owner/admin dashboard.
// ---------------------------------------------------------------------------

export default function TenantPortalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Portal Penyewa</h1>
          <p className="text-muted-foreground">
            Lihat tagihan, kontrak sewa, dan ajukan laporan maintenance.
          </p>
        </div>

        {/* TODO: Tenant portal dashboard — invoices, contract info, maintenance requests */}
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: "Tagihan Saya", desc: "Lihat dan bayar tagihan sewa bulanan." },
            { title: "Kontrak Sewa", desc: "Detail kontrak dan periode sewa aktif." },
            { title: "Laporan Maintenance", desc: "Ajukan permintaan perbaikan atau keluhan." },
            { title: "Profil Saya", desc: "Update data pribadi dan kontak darurat." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border bg-card p-6 shadow-sm"
            >
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

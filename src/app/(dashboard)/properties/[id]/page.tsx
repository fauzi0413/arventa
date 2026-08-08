import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Properti",
  description: "Detail unit, inventaris perabotan, dan status properti.",
};

// ---------------------------------------------------------------------------
// Property Detail — /properties/[id]
// ---------------------------------------------------------------------------
// Next.js 16: params is a Promise that must be awaited.
// ---------------------------------------------------------------------------

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Detail Properti</h1>
        <p className="text-muted-foreground">
          ID Properti: <code className="text-xs">{id}</code>
        </p>
      </div>

      {/* TODO: Property details, unit list, inventory per unit */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Informasi Properti</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Detail properti akan ditampilkan di sini.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Daftar Unit</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Daftar unit/kamar beserta status dan harga sewa.
          </p>
        </div>
      </div>
    </div>
  );
}

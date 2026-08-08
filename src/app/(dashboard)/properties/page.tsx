import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properti",
  description: "Kelola listing properti dan kamar Anda.",
};

// ---------------------------------------------------------------------------
// Properties Listing — /properties
// ---------------------------------------------------------------------------

export default function PropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Properti</h1>
          <p className="text-muted-foreground">
            Kelola semua properti kos, kontrakan, apartemen, dan ruko Anda.
          </p>
        </div>
        {/* TODO: Add property button */}
      </div>

      {/* TODO: Property cards / table with search & filter */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-center text-sm text-muted-foreground">
          Belum ada properti. Klik tombol di atas untuk menambahkan properti baru.
        </p>
      </div>
    </div>
  );
}

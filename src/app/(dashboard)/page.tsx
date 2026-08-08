import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ringkasan keuangan dan status properti Anda.",
};

// ---------------------------------------------------------------------------
// Dashboard Overview — / (root of dashboard group)
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di ARVENTA. Lihat ringkasan keuangan dan status properti Anda.
        </p>
      </div>

      {/* TODO: Financial overview cards, occupancy charts, recent activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Total Properti", "Unit Terisi", "Pendapatan Bulan Ini", "Tagihan Tertunggak"].map(
          (label) => (
            <div
              key={label}
              className="rounded-lg border bg-card p-6 shadow-sm"
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-bold">—</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

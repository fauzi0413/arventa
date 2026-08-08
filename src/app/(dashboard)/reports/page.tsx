import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan",
  description: "Generate dan export laporan keuangan dan operasional.",
};

// ---------------------------------------------------------------------------
// Reports Page — /reports
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
          <p className="text-muted-foreground">
            Generate laporan keuangan, okupansi, dan operasional. Export ke PDF atau Excel.
          </p>
        </div>
        {/* TODO: Export buttons (PDF / Excel) */}
      </div>

      {/* TODO: Report type selection, date range picker, generated reports */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { title: "Laporan Keuangan", desc: "Ringkasan pendapatan dan pengeluaran per properti." },
          { title: "Laporan Okupansi", desc: "Tingkat hunian dan statistik unit." },
          { title: "Laporan Penyewa", desc: "Data penyewa, kontrak aktif, dan riwayat." },
          { title: "Laporan Operasional", desc: "Tugas maintenance dan housekeeping." },
        ].map((report) => (
          <div
            key={report.title}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <h2 className="font-semibold">{report.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{report.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

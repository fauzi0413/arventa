import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keuangan",
  description: "Kelola invoice, pendapatan, dan pengeluaran properti.",
};

// ---------------------------------------------------------------------------
// Finance Page — /finance
// ---------------------------------------------------------------------------

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keuangan</h1>
          <p className="text-muted-foreground">
            Invoice tagihan, pendapatan sewa, dan pengeluaran operasional.
          </p>
        </div>
        {/* TODO: Create invoice / record expense button */}
      </div>

      {/* TODO: Tabs for Invoices, Income, Expenses with data tables */}
      <div className="grid gap-4 md:grid-cols-3">
        {["Pendapatan Bulan Ini", "Pengeluaran Bulan Ini", "Tunggakan"].map(
          (label) => (
            <div
              key={label}
              className="rounded-lg border bg-card p-6 shadow-sm"
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-bold">Rp 0</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

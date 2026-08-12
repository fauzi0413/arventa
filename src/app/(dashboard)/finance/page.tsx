import type { Metadata } from "next";
import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export const metadata: Metadata = {
  title: "Keuangan & Penagihan",
  description: "Kelola invoice tagihan, pendapatan sewa, dan pengeluaran operasional.",
};

export default function FinancePage() {
  return (
    <DeveloperModePlaceholder
      title="Keuangan & Penagihan Properti"
      path="/finance"
      description="Manajemen invoice tagihan sewa, rekonsiliasi pembayaran otomatis, laporan arus kas (pemasukan/pengeluaran), serta penagihan otomatis via WhatsApp."
      features={[
        "Automatic Invoice Generator",
        "Payment Gateway & Proof Verification",
        "Cashflow & Financial Reports",
      ]}
    />
  );
}

import type { Metadata } from "next";
import { InvoiceManagementView } from "@/components/finance/invoice-management-view";

export const metadata: Metadata = {
  title: "Keuangan & Penagihan | ARVENTA",
  description: "Manajemen invoice tagihan sewa unit properti, status pembayaran, dan penagihan.",
};

export default function FinancePage() {
  return <InvoiceManagementView />;
}

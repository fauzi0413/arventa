import type { Metadata } from "next";
import { ReportsManagementView } from "@/components/reports/reports-management-view";

export const metadata: Metadata = {
  title: "Laporan & Analytics | ARVENTA",
  description: "Generate dan export laporan keuangan, okupansi, penyewa, dan operasional per properti.",
};

export default function ReportsPage() {
  return <ReportsManagementView />;
}

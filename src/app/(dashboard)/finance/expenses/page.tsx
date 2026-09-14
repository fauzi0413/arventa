import type { Metadata } from "next";
import { ExpenseManagementView } from "@/components/finance/expense-management-view";

export const metadata: Metadata = {
  title: "Pengeluaran Operasional (OpEx) | ARVENTA",
  description: "Manajemen dan pencatatan pengeluaran operasional (OpEx) properti.",
};

export default function FinanceExpensesPage() {
  return <ExpenseManagementView />;
}

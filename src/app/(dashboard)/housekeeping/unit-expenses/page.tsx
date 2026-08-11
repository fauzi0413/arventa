import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export default function HousekeepingUnitExpensesPage() {
  return (
    <DeveloperModePlaceholder
      title="Keuangan & Penagihan Unit"
      path="/housekeeping/unit-expenses"
      description="Pencatatan pengeluaran operasional lapangan (pembelian token listrik, alat kebersihan) beserta foto nota."
      features={["Field OpEx Logger", "Receipt Image Upload", "Unit Expense History"]}
    />
  );
}

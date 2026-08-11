import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export default function HousekeepingInventoriesPage() {
  return (
    <DeveloperModePlaceholder
      title="Kondisi Perabotan & Unit"
      path="/housekeeping/inventories"
      description="Pencatatan inventaris perabotan (AC, Kasur, Lemari), update kondisi fisik, dan logger perbaikan."
      features={["Inventory Condition Tracker", "Damage Reporting", "Unit Furniture Log"]}
    />
  );
}

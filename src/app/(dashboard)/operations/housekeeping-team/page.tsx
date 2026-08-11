import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export default function HousekeepingTeamPage() {
  return (
    <DeveloperModePlaceholder
      title="Tim Operasional & Housekeeping"
      path="/operations/housekeeping-team"
      description="Penugasan tim housekeeping ke gedung properti, pemetaan wilayah tugas, dan monitoring performa kebersihan."
      features={["Property Assignment Mapping", "Staf Directory", "Monitoring Kebersihan"]}
    />
  );
}

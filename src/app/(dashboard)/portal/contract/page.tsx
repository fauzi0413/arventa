import type { Metadata } from "next";
import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export const metadata: Metadata = {
  title: "Kontrak & Dokumen",
  description: "Unduh file surat perjanjian sewa digital format PDF dan riwayat addendum kontrak.",
};

export default function TenantContractPage() {
  return (
    <DeveloperModePlaceholder
      title="Kontrak & Dokumen"
      path="/portal/contract"
      description="Unduh file surat perjanjian sewa digital format PDF dan riwayat addendum kontrak."
      features={["Digital PDF Contract", "Lease Terms View", "Download Verification"]}
    />
  );
}

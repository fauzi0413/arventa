import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export default function PlatformOwnersPage() {
  return (
    <DeveloperModePlaceholder
      title="Owner Management"
      path="/platform/owners"
      description="Kelola daftar owner properti terdaftar, onboarding owner baru, dan suspend/unsuspend akun owner."
      features={["Owner Directory", "Manual Onboarding Flow", "Account Suspend Guard"]}
    />
  );
}

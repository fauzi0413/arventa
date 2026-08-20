import { OwnerManagementManager } from "@/components/admin/owner-management-manager";

export const metadata = {
  title: "Owner Management | ARVENTA SaaS Platform",
  description: "Kelola daftar owner properti terdaftar, onboarding owner baru, dan penangguhan akun owner.",
};

export default function PlatformOwnersPage() {
  return <OwnerManagementManager />;
}

import { DeveloperModePlaceholder } from "@/components/shared/developer-mode";

export default function PlatformSettingsPage() {
  return (
    <DeveloperModePlaceholder
      title="Platform Settings & Integrasi"
      path="/platform/settings"
      description="Konfigurasi sistem global, maintenance mode toggle, dan integrasi API Gateway (Gemini AI, Resend Email)."
      features={["Global Maintenance Mode", "API Key Gateway", "Security Audit Log"]}
    />
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Masuk — ARVENTA Property Management",
  description: "Masuk ke akun ARVENTA untuk mengelola properti, unit, dan keuangan Anda.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#8FA28A]" />
          <span>Memuat formulir masuk...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

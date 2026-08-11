import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { IconLoader2 } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Masuk — ARVENTA Property Management",
  description: "Masuk ke akun ARVENTA untuk mengelola properti, unit, dan keuangan Anda.",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Masuk ke Akun Anda
        </h2>
        <p className="text-sm text-muted-foreground">
          Masukkan email dan password atau pilih preset role di bawah untuk langsung mencoba platform.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
            <IconLoader2 className="size-5 animate-spin text-primary" />
            <span>Memuat formulir masuk...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

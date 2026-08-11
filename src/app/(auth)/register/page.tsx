import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Daftar Akun — ARVENTA Admin Platform",
  description: "Buat akun ARVENTA baru untuk mulai mengelola properti Anda secara digital.",
};

// ---------------------------------------------------------------------------
// Register Page — /register
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  return (
    <Card className="border-border/60 shadow-xl backdrop-blur-md">
      <CardHeader className="space-y-2 text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Buat Akun ARVENTA
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Daftarkan akun baru untuk mengelola properti, unit, dan operasional Anda.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}

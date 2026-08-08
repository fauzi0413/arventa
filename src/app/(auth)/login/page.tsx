import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun ARVENTA untuk mengelola properti Anda.",
};

// ---------------------------------------------------------------------------
// Login Page — /login
// ---------------------------------------------------------------------------

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Masuk ke ARVENTA</h1>
        <p className="text-sm text-muted-foreground">
          Masukkan email dan password untuk mengakses dashboard Anda.
        </p>
      </div>

      {/* TODO: Login form with Supabase Auth */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-center text-sm text-muted-foreground">
          Form login akan diimplementasi di tahap berikutnya.
        </p>
      </div>
    </div>
  );
}

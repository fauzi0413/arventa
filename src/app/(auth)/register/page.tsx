import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun ARVENTA baru untuk mulai mengelola properti Anda.",
};

// ---------------------------------------------------------------------------
// Register Page — /register
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Buat Akun Baru</h1>
        <p className="text-sm text-muted-foreground">
          Daftar ke ARVENTA dan mulai kelola properti Anda secara digital.
        </p>
      </div>

      {/* TODO: Register form with Supabase Auth */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-center text-sm text-muted-foreground">
          Form registrasi akan diimplementasi di tahap berikutnya.
        </p>
      </div>
    </div>
  );
}

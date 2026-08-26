"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!token) {
      setErrorMessage("Token reset password tidak valid atau tidak ditemukan.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password minimal 8 karakter.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setErrorMessage("Password harus mengandung minimal 1 huruf besar (A-Z).");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setErrorMessage("Password harus mengandung minimal 1 angka (0-9).");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak cocok dengan password baru.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(
          json.message || "Gagal memperbarui password. Tautan mungkin telah kedaluwarsa."
        );
        return;
      }

      setSuccessMessage(
        json.message || "Password Anda telah berhasil diperbarui! Mengalihkan Anda ke halaman login..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setErrorMessage("Terjadi kesalahan sistem saat memperbarui password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-[#E1ECE0] bg-white p-8 shadow-xl text-center space-y-5 text-[#2F332E]">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-[#2F332E]">Tautan Tidak Valid</h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            Tautan atur ulang password ini tidak memiliki token yang sah atau telah kedaluwarsa.
          </p>
          <Link
            href="/forgot-password"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#6B8065] hover:bg-[#5A6E55] text-white font-black text-xs md:text-sm shadow-md transition-all inline-flex items-center justify-center gap-2"
          >
            <span>Minta Link Reset Baru</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl border border-[#E1ECE0] bg-white p-6 sm:p-8 space-y-6 shadow-xl text-[#2F332E]">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#F0F5EF] flex items-center justify-center text-[#5B7555] mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#2F332E] tracking-tight">
            Buat Password Baru
          </h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
            Masukkan password baru Anda untuk mengamankan akun ARVENTRA Anda.
          </p>
        </div>

        {/* Alert Error */}
        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 text-center font-semibold animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Alert Success */}
        {successMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="flex-1 space-y-1">
              <p className="font-bold text-sm text-emerald-900">Password Diperbarui!</p>
              <p className="leading-relaxed text-xs">{successMessage}</p>
            </div>
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#2F332E]">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Minimal 8 karakter (termasuk huruf kapital & angka)"
                  className="w-full rounded-xl border border-[#E1ECE0] bg-[#F9FAF8] focus:border-[#6B8065] focus:bg-white pl-10 pr-10 py-2.5 text-xs text-[#2F332E] font-medium placeholder-gray-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md flex items-center justify-center transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#2F332E]">
                Konfirmasi Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Ulangi password baru Anda"
                  className="w-full rounded-xl border border-[#E1ECE0] bg-[#F9FAF8] focus:border-[#6B8065] focus:bg-white pl-10 pr-10 py-2.5 text-xs text-[#2F332E] font-medium placeholder-gray-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md flex items-center justify-center transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-red-500 font-semibold mt-1">
                  ❌ Konfirmasi password tidak cocok dengan password baru
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-[#6B8065] hover:bg-[#5A6E55] text-white font-black text-xs md:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer pt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memperbarui Password...</span>
                </>
              ) : (
                <>
                  <span>Simpan Password Baru</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B7555]" />
        </div>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}

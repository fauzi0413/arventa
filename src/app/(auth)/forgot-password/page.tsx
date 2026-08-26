"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2, ArrowRight, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(
          json.message || "Gagal memproses permintaan reset password. Silakan periksa email Anda."
        );
        return;
      }

      setSuccessMessage(
        json.message || "Tautan atur ulang password telah dikirim ke email Anda. Silakan cek inbox/spam email Anda."
      );
    } catch (err: any) {
      setErrorMessage("Terjadi kesalahan koneksi. Silakan coba beberapa saat lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#E1ECE0] bg-white p-6 sm:p-8 space-y-6 shadow-xl text-[#2F332E]">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#F0F5EF] flex items-center justify-center text-[#5B7555] mb-2">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#2F332E] tracking-tight">
          Lupa Password Akun?
        </h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
          Masukkan email terdaftar Anda. Kami akan mengirimkan tautan untuk mengatur ulang password Anda.
        </p>
      </div>

      {/* Alert Error */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 text-center font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Alert Success */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div className="flex-1 space-y-1">
            <p className="font-bold text-sm text-emerald-900">Email Berhasil Dikirim!</p>
            <p className="leading-relaxed text-xs">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold text-[#2F332E]">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@domain.com"
              className="w-full rounded-xl border border-[#E1ECE0] bg-[#F9FAF8] pl-10 pr-4 py-2.5 text-xs text-[#2F332E] font-medium placeholder-gray-400 focus:border-[#6B8065] focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-2xl bg-[#6B8065] hover:bg-[#5A6E55] text-white font-black text-xs md:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengirim Instruksi...</span>
            </>
          ) : (
            <>
              <span>Kirim Link Reset Password</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Back Link */}
        <div className="text-center pt-2 border-t border-[#E1ECE0]">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#5B7555] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Login</span>
          </Link>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight, MailCheck } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Sedang memverifikasi tautan email Anda...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Tautan verifikasi tidak valid atau tidak memiliki token.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const json = await res.json();

        if (res.ok && json.success) {
          setStatus("success");
          setMessage(
            json.message || "Email Anda telah berhasil diverifikasi! Akun Anda kini sudah aktif."
          );
        } else {
          setStatus("error");
          setMessage(
            json.message || "Tautan verifikasi telah kedaluwarsa atau tidak valid."
          );
        }
      } catch (err) {
        setStatus("error");
        setMessage("Terjadi kesalahan jaringan saat memverifikasi akun Anda.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl border border-[#E1ECE0] bg-white p-8 shadow-xl text-center space-y-6 text-[#2F332E]">
        {/* Header Icon */}
        <div className="flex justify-center">
          {status === "loading" && (
            <div className="h-16 w-16 rounded-2xl bg-[#F0F5EF] flex items-center justify-center text-[#5B7555]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          )}
          {status === "error" && (
            <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-xs">
              <XCircle className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#2F332E] tracking-tight">
            {status === "loading" && "Memverifikasi Email..."}
            {status === "success" && "Verifikasi Berhasil!"}
            {status === "error" && "Verifikasi Gagal"}
          </h1>
          <p className="text-xs text-gray-600 font-medium leading-relaxed max-w-xs mx-auto">
            {message}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {status === "success" && (
            <Link
              href="/login"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#6B8065] hover:bg-[#5A6E55] text-white font-black text-xs md:text-sm shadow-md transition-all inline-flex items-center justify-center gap-2"
            >
              <span>Masuk ke Account Anda</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#6B8065] hover:bg-[#5A6E55] text-white font-black text-xs md:text-sm shadow-md transition-all inline-flex items-center justify-center gap-2"
              >
                <span>Coba Login Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-gray-500 font-medium">
                Membutuhkan bantuan? Silakan hubungi dukungan administrator kami.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B7555]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

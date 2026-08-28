"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Send,
  CheckCircle2,
} from "lucide-react";
import { UserRole } from "@/types/roles";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const getDestinationRoute = (role: UserRole): string => {
    switch (role) {
      case UserRole.PLATFORM_ADMIN:
        return "/platform/dashboard";
      case UserRole.HOUSEKEEPING:
        return "/housekeeping/room-grid";
      case UserRole.USER:
      case UserRole.TENANT:
        return "/portal/room";
      case UserRole.OWNER:
      default:
        return "/owner/dashboard";
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setErrorMessage("Silakan isi alamat email Anda terlebih dahulu.");
      return;
    }
    setResendLoading(true);
    setResendSuccess(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.message || "Gagal mengirim ulang email verifikasi.");
      } else {
        setResendSuccess(
          json.message || `Link verifikasi telah dikirim ulang ke ${email}. Silakan periksa inbox/spam Anda.`
        );
      }
    } catch (err) {
      setErrorMessage("Terjadi kesalahan koneksi saat mengirim ulang verifikasi.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setResendSuccess(null);
    setIsUnverified(false);

    try {
      // 1. Verify user credentials against Database Users table & issue JWT HttpOnly cookies
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const json = await loginRes.json();

      if (!loginRes.ok || !json.success) {
        setErrorMessage(
          json.message || "Gagal melakukan login. Silakan periksa kembali email dan password Anda."
        );
        if (json.error?.isUnverified) {
          setIsUnverified(true);
        } else {
          setIsUnverified(false);
        }
        setIsLoading(false);
        return;
      }

      const dbData = json.data;
      let activeRole: UserRole = UserRole.OWNER;
      let targetRoute = dbData?.destination || "/properties";

      if (dbData) {
        if (dbData.role === "TENANT" || dbData.role === "USER") {
          activeRole = UserRole.USER;
        } else if (dbData.role === "HOUSEKEEPING") {
          activeRole = UserRole.HOUSEKEEPING;
        } else if (dbData.role === "PLATFORM_ADMIN" || dbData.role === "SUPER_ADMIN") {
          activeRole = UserRole.PLATFORM_ADMIN;
        } else {
          activeRole = UserRole.OWNER;
        }
      }

      // 2. Set session cookies & localStorage with verified role & email
      document.cookie = "arventa_session=true; path=/; max-age=86400; SameSite=Lax";
      document.cookie = `arventa_demo_role=${activeRole}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `arventa_user_email=${encodeURIComponent(email)}; path=/; max-age=86400; SameSite=Lax`;
      if (typeof window !== "undefined") {
        localStorage.setItem("arventa_user_role", activeRole);
        localStorage.setItem("arventa_user_email", email);
      }

      // 3. Attempt Supabase login if configured
      try {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } catch (err) {}

      // 4. Navigate to destination route determined by user DB role
      router.push(targetRoute);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal melakukan login. Silakan coba lagi.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Gagal menghubungkan ke Google Sign-In");
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMessage("Terjadi kesalahan saat menghubungkan ke Google OAuth.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#E1ECE0] bg-white p-6 sm:p-8 space-y-6 shadow-xl text-[#2F332E]">
      {/* Card Title & Subtitle */}
      <div className="text-center space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-black text-[#2F332E] tracking-tight">
          Masuk ke Account ARVENTRA
        </h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
          Gunakan akun Google atau email terdaftar untuk mengakses dashboard
        </p>
      </div>

      {/* Success Alert (e.g. Resend Email) */}
      {resendSuccess && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <div className="flex-1">{resendSuccess}</div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 text-center font-semibold space-y-3">
          <p>{errorMessage}</p>

          {/* Resend Email Button if Unverified */}
          {isUnverified && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5B7555] hover:bg-[#445840] text-white px-4 py-2 text-xs font-black transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirim Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Ulang Email Verifikasi</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Google OAuth Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading || isGoogleLoading}
        className="w-full py-3 px-4 rounded-2xl border border-[#E1ECE0] bg-[#F9FAF8] hover:bg-white hover:border-[#6B8065] text-[#2F332E] font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#5B7555]" />
            <span>Menghubungkan ke Google...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-2">
        <div className="border-t border-[#E1ECE0] w-full" />
        <span className="bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider absolute">
          atau dengan email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Address Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold text-[#2F332E]">
            Email Address
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

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-extrabold text-[#2F332E]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-bold text-[#5B7555] hover:underline transition-colors"
            >
              Lupa password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#E1ECE0] bg-[#F9FAF8] pl-10 pr-10 py-2.5 text-xs text-[#2F332E] font-medium placeholder-gray-400 focus:border-[#6B8065] focus:bg-white focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md flex items-center justify-center transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Checkbox Remember Me */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#5B7555] focus:ring-[#5B7555]"
          />
          <label htmlFor="remember" className="text-xs text-gray-700 font-bold cursor-pointer">
            Ingat sesi login saya
          </label>
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
              <span>Memproses Login...</span>
            </>
          ) : (
            <>
              <span>Masuk</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Prominently Highlighted Link to Register Page */}
        <div className="rounded-2xl bg-[#F0F5EF] border border-[#D5E2D3] p-3.5 text-center text-xs font-bold text-gray-700 flex flex-col sm:flex-row items-center justify-center gap-2 shadow-xs">
          <span>Belum memiliki akun ARVENTRA?</span>
          <Link
            href="/register"
            className="font-black text-white bg-[#5B7555] hover:bg-[#445840] transition-all px-3.5 py-1.5 rounded-xl shadow-xs text-xs gap-1.5 inline-flex items-center"
          >
            <span>Daftar Sekarang</span>
            <Sparkles className="w-3.5 h-3.5 text-[#C8A96B]" />
          </Link>
        </div>

        {/* Bottom Link Back to Landing Page */}
        <div className="text-center pt-2 border-t border-[#E1ECE0]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#5B7555] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Landing Page Utama</span>
          </Link>
        </div>
      </form>
    </div>
  );
}

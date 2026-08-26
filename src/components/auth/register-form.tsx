"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconCheck,
  IconLoader2,
  IconUserPlus,
} from "@tabler/icons-react";

import { registerSchema, type RegisterInput } from "@/lib/validations/auth.schema";
import { UserRole } from "@/types/roles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      role: UserRole.OWNER, // Automatically defaults to OWNER role
      password: "",
      confirmPassword: "",
    },
  });

  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setVerificationLink(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          role: UserRole.OWNER, // Always register as OWNER
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(
          result.message || "Gagal membuat akun. Silakan periksa kembali data Anda."
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        result.message ||
          "Registrasi akun berhasil! Link verifikasi email telah dikirim. Silakan cek inbox email Anda."
      );
      if (result.data?.verificationLink) {
        setVerificationLink(result.data.verificationLink);
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      setErrorMessage("Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Gagal mendaftar dengan Google");
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMessage("Terjadi kesalahan saat menghubungkan ke Google OAuth.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-[#2F332E]">
      {/* Alert Error */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 font-semibold">
          <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Alert Success */}
      {successMessage && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 font-semibold">
            <IconCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="flex-1 space-y-1">
              <p className="font-bold text-sm text-emerald-900">Registrasi Berhasil!</p>
              <p className="leading-relaxed text-xs">{successMessage}</p>
            </div>
          </div>

          {/* Verification Link Action Banner (Simulasi / Quick Verification) */}
          {verificationLink && (
            <div className="rounded-2xl border border-[#D5E2D3] bg-[#F0F5EF] p-4 text-center space-y-2">
              <p className="text-xs font-bold text-[#2F332E]">
                Simulasi / Klik Tombol Dibawah untuk Verifikasi Email:
              </p>
              <a
                href={verificationLink}
                className="inline-flex items-center gap-2 rounded-xl bg-[#5B7555] px-4 py-2 text-xs font-black text-white hover:bg-[#445840] transition-colors shadow-xs"
              >
                <span>Verifikasi Email Akun Saya</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Google OAuth Register Button */}
      <button
        type="button"
        onClick={handleGoogleRegister}
        disabled={isLoading || isGoogleLoading}
        className="w-full py-3 px-4 rounded-2xl border border-[#E1ECE0] bg-[#F9FAF8] hover:bg-white hover:border-[#6B8065] text-[#2F332E] font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
      >
        {isGoogleLoading ? (
          <>
            <IconLoader2 className="size-4 animate-spin text-[#5B7555]" />
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
            <span>Daftar dengan Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-2">
        <div className="border-t border-[#E1ECE0] w-full" />
        <span className="bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider absolute">
          atau isi formulir
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs font-extrabold text-[#2F332E]">
            Nama Lengkap <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Contoh: Hendra Pratama"
            icon={<IconUser className="size-4 text-gray-400" />}
            aria-invalid={!!errors.fullName}
            className="rounded-xl border border-[#E1ECE0] bg-[#F9FAF8] focus:bg-white focus:border-[#6B8065] text-xs text-[#2F332E] font-medium placeholder-gray-400 dark:bg-[#F9FAF8] dark:text-[#2F332E]"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-extrabold text-[#2F332E]">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            icon={<IconMail className="size-4 text-gray-400" />}
            aria-invalid={!!errors.email}
            className="rounded-xl border border-[#E1ECE0] bg-[#F9FAF8] focus:bg-white focus:border-[#6B8065] text-xs text-[#2F332E] font-medium placeholder-gray-400 dark:bg-[#F9FAF8] dark:text-[#2F332E]"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber" className="text-xs font-extrabold text-[#2F332E]">
            Nomor HP / WhatsApp <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="081234567890"
            icon={<IconPhone className="size-4 text-gray-400" />}
            aria-invalid={!!errors.phoneNumber}
            className="rounded-xl border border-[#E1ECE0] bg-[#F9FAF8] focus:bg-white focus:border-[#6B8065] text-xs text-[#2F332E] font-medium placeholder-gray-400 dark:bg-[#F9FAF8] dark:text-[#2F332E]"
            {...register("phoneNumber")}
          />
          {errors.phoneNumber && (
            <p className="text-xs text-red-500 font-medium">{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-extrabold text-[#2F332E]">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter (termasuk huruf kapital & angka)"
              icon={<IconLock className="size-4 text-gray-400" />}
              aria-invalid={!!errors.password}
              className="rounded-xl border border-[#E1ECE0] bg-[#F9FAF8] focus:bg-white focus:border-[#6B8065] text-xs text-[#2F332E] font-medium placeholder-gray-400 dark:bg-[#F9FAF8] dark:text-[#2F332E]"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <IconEyeOff className="size-4" />
              ) : (
                <IconEye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-extrabold text-[#2F332E]">
            Konfirmasi Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Ulangi password Anda"
              icon={<IconLock className="size-4 text-gray-400" />}
              aria-invalid={!!errors.confirmPassword}
              className="rounded-xl border border-[#E1ECE0] bg-[#F9FAF8] focus:bg-white focus:border-[#6B8065] text-xs text-[#2F332E] font-medium placeholder-gray-400 dark:bg-[#F9FAF8] dark:text-[#2F332E]"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <IconEyeOff className="size-4" />
              ) : (
                <IconEye className="size-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-xs md:text-sm font-black rounded-2xl bg-[#6B8065] hover:bg-[#5A6E55] text-white shadow-md gap-2 mt-2"
          disabled={isLoading || !!successMessage}
        >
          {isLoading ? (
            <>
              <IconLoader2 className="size-4 animate-spin" />
              Mendaftarkan Akun Owner...
            </>
          ) : (
            <>
              <IconUserPlus className="size-4" />
              Daftar Akun Owner Baru
            </>
          )}
        </Button>
      </form>

      {/* Navigation Link to Login */}
      <div className="text-center text-xs text-gray-600 pt-3 border-t border-[#E1ECE0] font-semibold">
        Sudah memiliki akun?{" "}
        <Link
          href="/login"
          className="font-black text-[#5B7555] underline hover:text-[#445840] transition-colors"
        >
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}

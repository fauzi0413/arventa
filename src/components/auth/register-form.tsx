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

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

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

      setSuccessMessage("Akun Owner berhasil dibuat! Mengalihkan Anda ke halaman login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      console.error("Registration Error:", err);
      setErrorMessage("Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.");
      setIsLoading(false);
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
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 font-semibold">
          <IconCheck className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs font-extrabold text-[#2F332E]">
            Nama Lengkap <span className="text-[#5B7555]">*</span>
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Contoh: Hendra Pratama"
            icon={<IconUser className="size-4 text-gray-400" />}
            aria-invalid={!!errors.fullName}
            className="rounded-xl border-[#E1ECE0] bg-[#F9FAF8] focus:border-[#6B8065]"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-extrabold text-[#2F332E]">
            Email Address <span className="text-[#5B7555]">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            icon={<IconMail className="size-4 text-gray-400" />}
            aria-invalid={!!errors.email}
            className="rounded-xl border-[#E1ECE0] bg-[#F9FAF8] focus:border-[#6B8065]"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber" className="text-xs font-extrabold text-[#2F332E]">
            Nomor HP / WhatsApp (Opsional)
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="081234567890"
            icon={<IconPhone className="size-4 text-gray-400" />}
            aria-invalid={!!errors.phoneNumber}
            className="rounded-xl border-[#E1ECE0] bg-[#F9FAF8] focus:border-[#6B8065]"
            {...register("phoneNumber")}
          />
          {errors.phoneNumber && (
            <p className="text-xs text-red-500 font-medium">{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-extrabold text-[#2F332E]">
            Password <span className="text-[#5B7555]">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter (termasuk huruf kapital & angka)"
              icon={<IconLock className="size-4 text-gray-400" />}
              aria-invalid={!!errors.password}
              className="rounded-xl border-[#E1ECE0] bg-[#F9FAF8] focus:border-[#6B8065]"
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
            Konfirmasi Password <span className="text-[#5B7555]">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Ulangi password Anda"
              icon={<IconLock className="size-4 text-gray-400" />}
              aria-invalid={!!errors.confirmPassword}
              className="rounded-xl border-[#E1ECE0] bg-[#F9FAF8] focus:border-[#6B8065]"
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

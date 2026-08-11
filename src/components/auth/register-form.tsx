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
  IconShield,
  IconBuildingStore,
  IconSparkles,
  IconUserCheck,
} from "@tabler/icons-react";

import { registerSchema, type RegisterInput } from "@/lib/validations/auth.schema";
import { UserRole } from "@/types/roles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const rolesList = [
  {
    role: UserRole.OWNER,
    title: "Property Owner",
    desc: "Pemilik kos, kontrakan, atau apartemen",
    icon: IconBuildingStore,
  },
  {
    role: UserRole.PLATFORM_ADMIN,
    title: "Platform Admin",
    desc: "Pengelola platform & SaaS",
    icon: IconShield,
  },
  {
    role: UserRole.HOUSEKEEPING,
    title: "Housekeeping",
    desc: "Staf pembersih & operasional kamar",
    icon: IconSparkles,
  },
  {
    role: UserRole.USER,
    title: "Tenant (Penyewa)",
    desc: "Penghuni unit / kamar",
    icon: IconUserCheck,
  },
];

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
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      role: UserRole.OWNER,
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(
          result.message || "Gagal membuat akun. Silakan periksa kembali data Anda."
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Akun berhasil dibuat! Mengalihkan Anda ke halaman login...");
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
    <div className="space-y-6">
      {/* Alert Error */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive dark:bg-destructive/20">
          <IconAlertCircle className="mt-0.5 size-5 shrink-0" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Alert Success */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-600 dark:text-emerald-400">
          <IconCheck className="mt-0.5 size-5 shrink-0" />
          <div className="flex-1">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Contoh: Hendra Pratama"
            icon={<IconUser className="size-4 text-muted-foreground" />}
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            icon={<IconMail className="size-4 text-muted-foreground" />}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber">Nomor HP / WhatsApp (Opsional)</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="081234567890"
            icon={<IconPhone className="size-4 text-muted-foreground" />}
            aria-invalid={!!errors.phoneNumber}
            {...register("phoneNumber")}
          />
          {errors.phoneNumber && (
            <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Role Selection Grid */}
        <div className="space-y-1.5">
          <Label>Pilih Peran Pengguna</Label>
          <div className="grid grid-cols-2 gap-2">
            {rolesList.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedRole === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setValue("role", item.role)}
                  className={`flex flex-col gap-1 rounded-lg border p-2.5 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-input hover:bg-accent hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    {isSelected && <IconCheck className="size-3.5 text-primary" />}
                  </div>
                  <p className="font-semibold text-xs text-foreground">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter (termasuk huruf kapital & angka)"
              icon={<IconLock className="size-4 text-muted-foreground" />}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Ulangi password Anda"
              icon={<IconLock className="size-4 text-muted-foreground" />}
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 text-base font-semibold shadow-md gap-2 mt-2"
          disabled={isLoading || !!successMessage}
        >
          {isLoading ? (
            <>
              <IconLoader2 className="size-5 animate-spin" />
              Mendaftarkan Akun...
            </>
          ) : (
            <>
              <IconUserPlus className="size-5" />
              Daftar Akun Baru
            </>
          )}
        </Button>
      </form>

      {/* Navigation Link to Login */}
      <div className="text-center text-sm text-muted-foreground pt-2">
        Sudah memiliki akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}

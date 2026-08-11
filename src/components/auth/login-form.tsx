"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconArrowRight,
  IconLoader2,
  IconShieldCheck,
  IconBuildingStore,
  IconSparkles,
  IconUserCheck,
  IconCheck,
} from "@tabler/icons-react";

import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const demoAccounts = [
  {
    label: "Platform Admin",
    roleDesc: "SaaS & Admin Portal",
    email: "admin@arventa.id",
    icon: IconShieldCheck,
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
  },
  {
    label: "Property Owner",
    roleDesc: "Pemilik Gedung & Finansial",
    email: "owner@arventa.id",
    icon: IconBuildingStore,
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
  },
  {
    label: "Housekeeping Staff",
    roleDesc: "Petugas Ops & Kebersihan",
    email: "hk.budi@arventa.id",
    icon: IconSparkles,
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
  },
  {
    label: "Tenant (Siti)",
    roleDesc: "Penghuni / Penyewa Kamar",
    email: "tenant.siti@gmail.com",
    icon: IconUserCheck,
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
  },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Email atau password yang Anda masukkan salah.");
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (authData.session) {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setErrorMessage("Terjadi masalah jaringan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleQuickFill = (email: string) => {
    setActiveEmail(email);
    setValue("email", email, { shouldValidate: true });
    setValue("password", "Password123!", { shouldValidate: true });
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Alert Error */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive dark:bg-destructive/20">
          <IconAlertCircle className="mt-0.5 size-5 shrink-0" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Alamat Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@arventa.id"
            autoComplete="email"
            icon={<IconMail className="size-4 text-muted-foreground" />}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Kata Sandi
            </Label>
            <span className="text-[11px] text-muted-foreground">Default: Password123!</span>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
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
              <span className="sr-only">
                {showPassword ? "Sembunyikan password" : "Tampilkan password"}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20 gap-2 mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <IconLoader2 className="size-5 animate-spin" />
              Memverifikasi Sesi...
            </>
          ) : (
            <>
              Masuk ke Dashboard
              <IconArrowRight className="size-5" />
            </>
          )}
        </Button>
      </form>

      {/* Quick Role Preset Selector */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            ⚡ Quick Demo Login (Pilih Role)
          </p>
          <span className="text-[10px] text-muted-foreground">Klik akun lalu tekan Masuk</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {demoAccounts.map((account) => {
            const Icon = account.icon;
            const isSelected = activeEmail === account.email;

            return (
              <button
                key={account.email}
                type="button"
                onClick={() => handleQuickFill(account.email)}
                className={`group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${account.badgeColor} ${
                  isSelected ? "ring-2 ring-primary border-primary shadow-sm" : ""
                }`}
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-background/80 shadow-sm shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs leading-tight truncate">{account.label}</p>
                    {isSelected && <IconCheck className="size-3.5 text-primary shrink-0" />}
                  </div>
                  <p className="text-[10px] opacity-80 truncate mt-0.5">{account.roleDesc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Register Link */}
      <div className="text-center text-xs text-muted-foreground pt-2">
        Belum memiliki akun ARVENTA?{" "}
        <Link
          href="/register"
          className="font-bold text-primary underline-offset-4 hover:underline"
        >
          Daftar Akun Baru
        </Link>
      </div>
    </div>
  );
}

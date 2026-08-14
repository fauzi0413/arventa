"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Shield,
  Users,
  Bed,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { UserRole } from "@/types/roles";
import { createClient } from "@/lib/supabase/client";

interface RolePreset {
  id: UserRole;
  label: string;
  email: string;
  icon: React.ElementType;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: UserRole.OWNER,
    label: "OWNER",
    email: "budi@kostsejahtera.com",
    icon: User,
  },
  {
    id: UserRole.PLATFORM_ADMIN,
    label: "PLATFORM_ADMIN",
    email: "admin@arventra.id",
    icon: Shield,
  },
  {
    id: UserRole.HOUSEKEEPING,
    label: "HOUSEKEEPING",
    email: "agus.hk@arventra.id",
    icon: Users,
  },
  {
    id: UserRole.USER,
    label: "TENANT",
    email: "siti.rahma@gmail.com",
    icon: Bed,
  },
];

export function LoginForm() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.OWNER);
  const [email, setEmail] = useState("budi@kostsejahtera.com");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelect = (preset: RolePreset) => {
    setSelectedRole(preset.id);
    setEmail(preset.email);
    setPassword("Password123!");
    setErrorMessage(null);
  };

  // Exact entry routes matching Order 1 in prisma/seeders/roles-menus.seeder.ts
  const getDestinationRoute = (role: UserRole): string => {
    switch (role) {
      case UserRole.PLATFORM_ADMIN:
        return "/platform/dashboard";
      case UserRole.HOUSEKEEPING:
        return "/housekeeping/room-grid";
      case UserRole.USER:
        return "/portal/room";
      case UserRole.OWNER:
      default:
        return "/owner/dashboard";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Set session cookies for demo/dev session
      document.cookie = "arventa_session=true; path=/; max-age=86400";
      document.cookie = `arventa_demo_role=${selectedRole}; path=/; max-age=86400`;
      if (typeof window !== "undefined") {
        localStorage.setItem("arventa_user_role", selectedRole);
      }

      // 2. Attempt Supabase login if real backend is configured
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.warn("Supabase auth response:", error.message);
        }
      } catch (err) {
        console.warn("Supabase client auth fallback active:", err);
      }

      // 3. Navigate to the role's specific entry route from roles-menus.seeder.ts
      const targetRoute = getDestinationRoute(selectedRole);
      router.push(targetRoute);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal melakukan login. Silakan coba lagi.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
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
          Pilih peran pengguna dan masukkan kredensial untuk mengakses dashboard
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 text-center font-semibold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Role Selection Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-[#2F332E]">
            Pilih Peran Pengguna (Role):
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {ROLE_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedRole === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleRoleSelect(preset)}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-bold transition-all text-left cursor-pointer ${
                    isSelected
                      ? "border-[#6B8065] bg-[#F0F5EF] text-[#2F332E] shadow-xs ring-1 ring-[#6B8065]"
                      : "border-[#E1ECE0] bg-[#F9FAF8] text-gray-600 hover:border-[#6B8065]/50 hover:bg-[#F0F5EF]/50"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#5B7555] text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Email Address Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold text-[#2F332E]">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
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
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Silakan hubungi administrator untuk reset password.");
              }}
              className="text-[11px] font-bold text-[#5B7555] hover:underline transition-colors"
            >
              Lupa password?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
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
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-0.5"
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

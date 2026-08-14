"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import packageJson from "../../../package.json";
import {
  Building2,
  Building,
  Store,
  CheckCircle2,
  Users,
  BedDouble,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Receipt,
  Wallet,
  ClipboardList,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/types/roles";

export function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardHref, setDashboardHref] = useState("/dashboard");
  const [userRoleText, setUserRoleText] = useState<string | null>(null);

  useEffect(() => {
    async function checkUserAuth() {
      try {
        let activeRole: string | null = null;
        let loggedIn = false;

        // 1. Try Supabase user session
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            loggedIn = true;
            activeRole = user.user_metadata?.role || user.app_metadata?.role || null;
          }
        } catch (err) {
          console.warn("Supabase auth check error:", err);
        }

        // 2. Fallback check for session cookie or localStorage
        if (typeof window !== "undefined") {
          const hasSessionCookie = document.cookie.includes("arventa_session=true");
          const savedRole =
            localStorage.getItem("arventa_user_role") ||
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("arventa_demo_role="))
              ?.split("=")[1];

          if (hasSessionCookie || savedRole) {
            loggedIn = true;
            if (!activeRole && savedRole) {
              activeRole = savedRole;
            }
          }
        }

        setIsLoggedIn(loggedIn);

        // 3. Map route according to role (Order 1 in prisma/seeders/roles-menus.seeder.ts)
        if (activeRole) {
          setUserRoleText(activeRole);
          if (activeRole === UserRole.PLATFORM_ADMIN || activeRole === "PLATFORM_ADMIN") {
            setDashboardHref("/platform/dashboard");
          } else if (activeRole === UserRole.HOUSEKEEPING || activeRole === "HOUSEKEEPING") {
            setDashboardHref("/housekeeping/room-grid");
          } else if (activeRole === UserRole.USER || activeRole === "TENANT" || activeRole === "USER") {
            setDashboardHref("/portal/room");
          } else {
            setDashboardHref("/owner/dashboard");
          }
        } else {
          setDashboardHref("/owner/dashboard");
        }
      } catch (err) {
        console.error("Landing page auth check error:", err);
      }
    }

    checkUserAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#2F332E] font-sans">
      {/* ---------------------------------------------------------------- Top Sticky Header ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-[#F7F4ED]/90 backdrop-blur-md border-b border-[#C7D3C0]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Tagline */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#8FA28A] flex items-center justify-center text-white font-black text-lg shadow-sm">
              A
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#2F332E] block leading-none">
                ARVENTRA
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Kelola Aset dalam Genggaman
              </span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-600">
            <a href="#jenis-properti" className="hover:text-[#8FA28A] transition-colors">
              Jenis Properti
            </a>
            <a href="#metrik-platform" className="hover:text-[#8FA28A] transition-colors">
              Metrik Platform
            </a>
            <a href="#fitur-utama" className="hover:text-[#8FA28A] transition-colors">
              Fitur Utama
            </a>
            <a href="#paket-harga" className="hover:text-[#8FA28A] transition-colors">
              Paket Harga
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!isLoggedIn ? (
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Masuk / Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href={dashboardHref}
                className="px-5 py-2.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 ring-2 ring-[#8FA28A]/30"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Masuk Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- HERO SECTION ---------------------------------------------------------------- */}
      <section className="py-20 md:py-28 text-center px-4 max-w-5xl mx-auto space-y-8">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#C7D3C0]/60 text-xs font-bold text-[#8FA28A] shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C8A96B]" />
          Property Management System (PMS) SaaS
        </div>

        {/* Main Heading & Pill Subtitle */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-[#2F332E] tracking-tight leading-tight">
            Kelola Properti Kos, Apartemen, Kontrakan & Ruko
          </h1>
          <div className="pt-2">
            <span className="inline-block px-8 py-3 rounded-full bg-[#8FA28A] text-white text-3xl md:text-5xl font-black tracking-tight shadow-sm">
              Dalam Satu Genggaman
            </span>
          </div>
        </div>

        {/* Description Paragraph */}
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
          ARVENTRA membantu pemilik properti mengelola unit, penyewa, OpEx, pengeluaran, tagihan, housekeeping, dan analisis keuangan secara terpusat.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {!isLoggedIn ? (
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs md:text-sm font-bold transition-all shadow-md flex items-center gap-2"
            >
              Mulai Kelola Properti
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href={dashboardHref}
              className="px-6 py-3.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs md:text-sm font-bold transition-all shadow-md flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Masuk Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------- JENIS PROPERTI SECTION ---------------------------------------------------------------- */}
      <section id="jenis-properti" className="py-20 px-4 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[11px] font-extrabold uppercase tracking-wider">
            4 Jenis Properti Didukung
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-[#2F332E]">
            Dirancang Fleksibel Untuk Berbagai Jenis Aset
          </h2>
          <p className="text-xs md:text-sm text-gray-500 max-w-xl mx-auto">
            Dukungan pengelolaan dari kos-kosan bulanan hingga ruang usaha ruko & apartemen.
          </p>
        </div>

        {/* Grid 4 Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Kos-kosan */}
          <div className="rounded-3xl border border-[#C7D3C0]/40 bg-white/70 backdrop-blur-xs p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-44 w-full rounded-2xl overflow-hidden bg-gray-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800"
                  alt="Kos-kosan"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#C8A96B]/15 text-[#C8A96B] text-[10px] font-bold">
                Kos Harian & Bulanan
              </span>
              <h3 className="text-lg font-bold text-[#2F332E]">Kos-kosan</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manajemen lantai, nomor kamar, fasilitas kamar, kamar mandi dalam, dan deposit sewa.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 text-[11px] font-bold text-[#8FA28A] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Fasilitas & Kamar Mandi Dalam
            </div>
          </div>

          {/* Card 2: Apartemen */}
          <div className="rounded-3xl border border-[#C7D3C0]/40 bg-white/70 backdrop-blur-xs p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-44 w-full rounded-2xl overflow-hidden bg-gray-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800"
                  alt="Apartemen"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[10px] font-bold">
                Multi-Tower & Unit
              </span>
              <h3 className="text-lg font-bold text-[#2F332E]">Apartemen</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manajemen tower, lantai, nomor unit, kamar internal, dan tagihan IPL berkala.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 text-[11px] font-bold text-[#8FA28A] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Manajemen Unit & IPL
            </div>
          </div>

          {/* Card 3: Kontrakan */}
          <div className="rounded-3xl border border-[#C7D3C0]/40 bg-white/70 backdrop-blur-xs p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-44 w-full rounded-2xl overflow-hidden bg-gray-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=800"
                  alt="Kontrakan"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#C8A96B]/15 text-[#C8A96B] text-[10px] font-bold">
                Paviliun & Rumah
              </span>
              <h3 className="text-lg font-bold text-[#2F332E]">Kontrakan</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manajemen rumah kontrakan/paviliun, masa sewa tahunan, serta tagihan independen.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 text-[11px] font-bold text-[#8FA28A] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Kontrak Jangka Panjang
            </div>
          </div>

          {/* Card 4: Ruko */}
          <div className="rounded-3xl border border-[#C7D3C0]/40 bg-white/70 backdrop-blur-xs p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-44 w-full rounded-2xl overflow-hidden bg-gray-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800"
                  alt="Ruko"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[10px] font-bold">
                Ruang Komersial
              </span>
              <h3 className="text-lg font-bold text-[#2F332E]">Ruko</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manajemen ruang komersial, ruko bisnis, kontrak tenant usaha, dan laporan sewa.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 text-[11px] font-bold text-[#8FA28A] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Tenant Usaha & Bisnis
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- METRIK PLATFORM SECTION ---------------------------------------------------------------- */}
      <section id="metrik-platform" className="py-20 px-4 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[11px] font-extrabold uppercase tracking-wider">
            Ringkasan Platform ARVENTRA
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-[#2F332E]">
            ARVENTRA dalam Angka
          </h2>
          <p className="text-xs md:text-sm text-gray-500 max-w-xl mx-auto">
            Kepercayaan ribuan pemilik properti dan penyewa di berbagai daerah.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-[#C7D3C0]/40 bg-white p-8 text-center space-y-3 shadow-xs">
            <div className="h-12 w-12 rounded-2xl bg-[#8FA28A]/10 text-[#8FA28A] flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <span className="block text-3xl md:text-4xl font-black text-[#2F332E]">
              48+
            </span>
            <div>
              <p className="text-xs font-bold text-[#8FA28A]">Active Owners</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Pemilik properti terdaftar</p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#C7D3C0]/40 bg-white p-8 text-center space-y-3 shadow-xs">
            <div className="h-12 w-12 rounded-2xl bg-[#C8A96B]/10 text-[#C8A96B] flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="block text-3xl md:text-4xl font-black text-[#2F332E]">
              142+
            </span>
            <div>
              <p className="text-xs font-bold text-[#C8A96B]">Total Properti</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Kos, apartemen, kontrakan & ruko</p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#C7D3C0]/40 bg-white p-8 text-center space-y-3 shadow-xs">
            <div className="h-12 w-12 rounded-2xl bg-[#8FA28A]/10 text-[#8FA28A] flex items-center justify-center mx-auto">
              <BedDouble className="w-6 h-6" />
            </div>
            <span className="block text-3xl md:text-4xl font-black text-[#2F332E]">
              1.240+
            </span>
            <div>
              <p className="text-xs font-bold text-[#8FA28A]">Kamar Terdaftar</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Kamar & unit terkelola</p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#C7D3C0]/40 bg-white p-8 text-center space-y-3 shadow-xs">
            <div className="h-12 w-12 rounded-2xl bg-[#8FA28A]/10 text-[#8FA28A] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="block text-3xl md:text-4xl font-black text-[#2F332E]">
              99.9%
            </span>
            <div>
              <p className="text-xs font-bold text-[#8FA28A]">Platform Availability</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Sistem handal & stabil</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- FITUR UTAMA SECTION ---------------------------------------------------------------- */}
      <section id="fitur-utama" className="py-20 px-4 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[11px] font-extrabold uppercase tracking-wider">
            Fitur Utama Platform
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-[#2F332E]">
            Solusi Terpadu Pengelolaan Properti Modern
          </h2>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-[#C7D3C0]/30 bg-white/80 p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-[#F7F4ED] border border-[#C7D3C0]/30 flex items-center justify-center text-[#8FA28A]">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#2F332E]">Property Management</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Kelola banyak aset properti kos, apartemen, kontrakan, dan ruko dalam satu dashboard terpusat.
            </p>
          </div>

          <div className="rounded-3xl border border-[#C7D3C0]/30 bg-white/80 p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-[#F7F4ED] border border-[#C7D3C0]/30 flex items-center justify-center text-[#8FA28A]">
              <BedDouble className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#2F332E]">Room Management</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pantau status kamar secara room-centric (Available, Occupied, Need Cleaning, Maintenance).
            </p>
          </div>

          <div className="rounded-3xl border border-[#C7D3C0]/30 bg-white/80 p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-[#F7F4ED] border border-[#C7D3C0]/30 flex items-center justify-center text-[#8FA28A]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#2F332E]">Tenant Management</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pencatatan profil penyewa, data KTP, kontrak sewa, dan riwayat pembayaran sewa.
            </p>
          </div>

          <div className="rounded-3xl border border-[#C7D3C0]/30 bg-white/80 p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-[#F7F4ED] border border-[#C7D3C0]/30 flex items-center justify-center text-[#8FA28A]">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#2F332E]">Housekeeping Grid</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Penugasan staf lapangan, update status pembersihan kamar, dan checklist inventaris.
            </p>
          </div>

          <div className="rounded-3xl border border-[#C7D3C0]/30 bg-white/80 p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-[#F7F4ED] border border-[#C7D3C0]/30 flex items-center justify-center text-[#8FA28A]">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#2F332E]">Invoice & Payment</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pembuatan invoice otomatis, bukti bayar digital, dan peringatan tunggakan sewa.
            </p>
          </div>

          <div className="rounded-3xl border border-[#C7D3C0]/30 bg-white/80 p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-[#F7F4ED] border border-[#C7D3C0]/30 flex items-center justify-center text-[#8FA28A]">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#2F332E]">Financial Management</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pencatatan pendapatan (Income), pengeluaran operasional (OpEx), dan laba bersih (net profit).
            </p>
          </div>

          <div className="rounded-3xl border border-[#C7D3C0]/30 bg-white/80 p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-[#F7F4ED] border border-[#C7D3C0]/30 flex items-center justify-center text-[#8FA28A]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#2F332E]">AI Financial Insight</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Analisis cerdas proyeksi pendapatan dan rekomendasi penyesuaian tarif sewa kamar.
            </p>
          </div>

          <div className="rounded-3xl border border-[#C7D3C0]/30 bg-white/80 p-6 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-[#F7F4ED] border border-[#C7D3C0]/30 flex items-center justify-center text-[#8FA28A]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#2F332E]">Reporting & Analytics</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Laporan keuangan bulanan, tren okupansi, dan data ekspor PDF/Excel.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- PAKET HARGA SUBSCRIPTION SECTION ---------------------------------------------------------------- */}
      <section id="paket-harga" className="py-20 px-4 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#C8A96B]/20 text-[#C8A96B] text-xs font-extrabold uppercase tracking-wider">
            Paket Harga Subscription
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-[#2F332E]">
            Pilihan Paket Sesuai Skala Properti Anda
          </h2>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
          {/* Card 1: BASIC */}
          <div className="rounded-3xl border border-[#C7D3C0]/50 bg-white p-8 space-y-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[10px] font-bold uppercase">
                BASIC
              </span>
              <div>
                <span className="text-3xl font-black text-[#2F332E]">Rp 99.000</span>
                <span className="text-xs text-gray-400 font-semibold">/bln</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Cocok untuk pemilik kos kecil atau 1 bangunan kos-kosan.
              </p>
              <ul className="space-y-2.5 pt-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8FA28A] shrink-0" />
                  Batas Hingga 15 Kamar
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8FA28A] shrink-0" />
                  Pencatatan Tenant & Invoice
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8FA28A] shrink-0" />
                  WhatsApp Payment Reminder
                </li>
              </ul>
            </div>
            <Link
              href="/login"
              className="w-full py-3 rounded-xl border border-[#C7D3C0] hover:bg-gray-50 text-xs font-bold text-gray-700 text-center transition-all block"
            >
              Pilih Basic
            </Link>
          </div>

          {/* Card 2: BUSINESS (POPULAR) */}
          <div className="rounded-3xl border-2 border-[#8FA28A] bg-white p-8 space-y-6 flex flex-col justify-between shadow-lg relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#8FA28A] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
              POPULAR
            </div>

            <div className="space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[10px] font-bold uppercase">
                BUSINESS
              </span>
              <div>
                <span className="text-3xl font-black text-[#2F332E]">Rp 249.000</span>
                <span className="text-xs text-gray-400 font-semibold">/bln</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Untuk pemilik kos menengah, apartemen, atau kontrakan multi-lokasi.
              </p>
              <ul className="space-y-2.5 pt-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8FA28A] shrink-0" />
                  Batas Hingga 50 Kamar
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8FA28A] shrink-0" />
                  Fitur Housekeeping & OpEx
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8FA28A] shrink-0" />
                  AI Financial Insight Card
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8FA28A] shrink-0" />
                  Multi-Staff Role Access
                </li>
              </ul>
            </div>
            <Link
              href="/login"
              className="w-full py-3.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs font-bold text-center transition-all shadow-sm block"
            >
              Coba Business Demo
            </Link>
          </div>

          {/* Card 3: PRO */}
          <div className="rounded-3xl border border-[#C7D3C0]/50 bg-white p-8 space-y-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-[#C8A96B]/20 text-[#C8A96B] text-[10px] font-bold uppercase">
                PRO
              </span>
              <div>
                <span className="text-3xl font-black text-[#2F332E]">Rp 499.000</span>
                <span className="text-xs text-gray-400 font-semibold">/bln</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Untuk pengelola aset skala besar, ruko komersial & apartemen.
              </p>
              <ul className="space-y-2.5 pt-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C8A96B] shrink-0" />
                  Unlimited Kamar & Properti
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C8A96B] shrink-0" />
                  Custom Workflow & Audit Log
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C8A96B] shrink-0" />
                  Priority Dedicated Support
                </li>
              </ul>
            </div>
            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-[#C8A96B] hover:bg-[#C8A96B]/90 text-white text-xs font-bold text-center transition-all shadow-sm block"
            >
              Pilih Pro Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- BOTTOM CTA BANNER ---------------------------------------------------------------- */}
      <section className="bg-[#242823] text-white py-16 md:py-20 px-4 text-center space-y-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Kelola Semua Properti dalam Satu Platform
          </h2>
          <p className="text-xs md:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
            Gunakan ARVENTRA sekarang untuk efisiensi operasional kos, apartemen, kontrakan, dan ruko Anda.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#C8A96B] hover:bg-[#C8A96B]/90 text-white text-xs md:text-sm font-bold transition-all shadow-md"
            >
              Mulai Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- DARK FOOTER ---------------------------------------------------------------- */}
      <footer className="bg-[#1C1F1B] border-t border-[#383E36] text-xs text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#8FA28A] text-white flex items-center justify-center font-black text-sm shadow-xs">
              A
            </div>
            <div>
              <span className="font-black text-white text-sm block leading-none">
                ARVENTRA
              </span>
              <span className="text-[11px] text-gray-400">
                Kelola Aset dalam Genggaman
              </span>
            </div>
          </div>

          {/* Center Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-300">
            <a href="#jenis-properti" className="hover:text-white transition-colors">
              Jenis Properti
            </a>
            <a href="#fitur-utama" className="hover:text-white transition-colors">
              Fitur Utama
            </a>
            <a href="#paket-harga" className="hover:text-white transition-colors">
              Paket Harga
            </a>
            <Link href="/login" className="hover:text-white transition-colors">
              Login
            </Link>
          </div>

          {/* Right Copyright */}
          <p className="text-gray-400 text-xs">
            © 2026 ARVENTRA v{packageJson.version}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

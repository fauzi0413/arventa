"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import CarouselStacked, { DEFAULT_SLIDES } from "@/components/ui/feature-showcase";
import type { FeatureSlide } from "@/types/feature-showcase";
import { FAQ, type FaqItem } from "@/components/ui/faq-tabs";
import packageJson from "../../../package.json";
import {
  Building2,
  Store,
  CheckCircle2,
  BedDouble,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Home,
  Key,
  Users,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/types/roles";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface LandingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  priceYearlyPerMonth: number;
  discountPercent: number;
  maxProperties: number;
  maxUnits: number;
  maxHousekeeping: number;
  features: string[];
  isDefault: boolean;
  isMostPopular: boolean;
  subscriberCount: number;
}

interface LandingPageProps {
  initialFeatureSlides?: FeatureSlide[];
}

export function LandingPage({ initialFeatureSlides }: LandingPageProps = {}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardHref, setDashboardHref] = useState("/dashboard");
  const [userRoleText, setUserRoleText] = useState<string | null>(null);

  // FAQ state — fetched from public API
  const [faqCategories, setFaqCategories] = useState<Record<string, string>>({});
  const [faqData, setFaqData] = useState<Record<string, FaqItem[]>>({});

  // Feature Showcase state — initialized directly from server (SSR) to eliminate flash of default slides
  const [featureSlides, setFeatureSlides] = useState<FeatureSlide[] | null>(
    initialFeatureSlides && initialFeatureSlides.length > 0 ? initialFeatureSlides : null
  );

  // Subscription Plans state — fetched from public API
  const [plans, setPlans] = useState<LandingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatureShowcase() {
      try {
        const res = await fetch("/api/feature-showcase");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setFeatureSlides(json.data);
        }
      } catch {
        // silently fail — carousel falls back to DEFAULT_SLIDES
      }
    }
    fetchFeatureShowcase();
  }, []);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/plans");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.plans)) {
          setPlans(json.data.plans);
        }
      } catch {
        // silently fail
      } finally {
        setPlansLoading(false);
      }
    }
    fetchPlans();
  }, []);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const res = await fetch("/api/faq");
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success) return;

        const cats: Record<string, string> = {};
        for (const cat of json.data.categories as string[]) {
          cats[cat] = cat
            .split(" ")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
        }
        setFaqCategories(cats);
        setFaqData(json.data.faqs);
      } catch {
        // silently fail — FAQ is non-critical
      }
    }
    fetchFaqs();
  }, []);

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
                ARVENTA
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
            <a href="#faq" className="hover:text-[#8FA28A] transition-colors">
              FAQ
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
        <ScrollReveal delay={0} blur={4} y={20}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#C7D3C0]/60 text-xs font-bold text-[#8FA28A] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C8A96B]" />
            Property Management System (PMS) SaaS
          </div>
        </ScrollReveal>

        {/* Main Heading & Pill Subtitle */}
        <ScrollReveal delay={0.1} y={24}>
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
        </ScrollReveal>

        {/* Description Paragraph */}
        <ScrollReveal delay={0.18} y={16} blur={3}>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            ARVENTA membantu pemilik properti mengelola unit, penyewa, OpEx, pengeluaran, tagihan, housekeeping, dan analisis keuangan secara terpusat.
          </p>
        </ScrollReveal>

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
        <ScrollReveal y={24} blur={4}>
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
        </ScrollReveal>

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
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#C8A96B]/15 text-[#C8A96B] text-[10px] font-bold whitespace-nowrap">
                Kos Harian & Bulanan
              </span>
              <h3 className="text-lg font-bold text-[#2F332E]">Kos-kosan</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manajemen lantai, nomor kamar, fasilitas kamar, kamar mandi dalam, dan deposit sewa.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 text-[11px] font-bold text-[#8FA28A] flex items-center gap-1.5 whitespace-nowrap">
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
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[10px] font-bold whitespace-nowrap">
                Multi-Tower & Unit
              </span>
              <h3 className="text-lg font-bold text-[#2F332E]">Apartemen</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manajemen tower, lantai, nomor unit, kamar internal, dan tagihan IPL berkala.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 text-[11px] font-bold text-[#8FA28A] flex items-center gap-1.5 whitespace-nowrap">
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
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#C8A96B]/15 text-[#C8A96B] text-[10px] font-bold whitespace-nowrap">
                Paviliun & Rumah
              </span>
              <h3 className="text-lg font-bold text-[#2F332E]">Kontrakan</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manajemen rumah kontrakan/paviliun, masa sewa tahunan, serta tagihan independen.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 text-[11px] font-bold text-[#8FA28A] flex items-center gap-1.5 whitespace-nowrap">
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
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[10px] font-bold whitespace-nowrap">
                Ruang Komersial
              </span>
              <h3 className="text-lg font-bold text-[#2F332E]">Ruko</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manajemen ruang komersial, ruko bisnis, kontrak tenant usaha, dan laporan sewa.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 text-[11px] font-bold text-[#8FA28A] flex items-center gap-1.5 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Tenant Usaha & Bisnis
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- METRIK PLATFORM SECTION ---------------------------------------------------------------- */}
      <section id="metrik-platform" className="py-20 px-4 max-w-7xl mx-auto space-y-12">
        <ScrollReveal y={24} blur={4}>
          <div className="text-center space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[11px] font-extrabold uppercase tracking-wider">
              Ringkasan Platform ARVENTA
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#2F332E]">
              ARVENTA dalam Angka
            </h2>
            <p className="text-xs md:text-sm text-gray-500 max-w-xl mx-auto">
              Kepercayaan ribuan pemilik properti dan penyewa di berbagai daerah.
            </p>
          </div>
        </ScrollReveal>

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
      <section id="fitur-utama" className="py-12 md:py-16 w-full space-y-6 overflow-visible">
        <ScrollReveal y={24} blur={4}>
          <div className="text-center space-y-3 max-w-5xl mx-auto px-4">
            <span className="inline-block px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[11px] font-extrabold uppercase tracking-wider">
              Fitur Utama Platform
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#2F332E]">
              Solusi Terpadu Pengelolaan Properti Modern
            </h2>
          </div>
        </ScrollReveal>

        {/* Sliding Stacked Carousel */}
        <CarouselStacked slides={featureSlides ?? DEFAULT_SLIDES} />
      </section>

      {/* ---------------------------------------------------------------- PAKET HARGA SUBSCRIPTION SECTION ---------------------------------------------------------------- */}
      <section id="paket-harga" className="py-10 px-4 max-w-7xl mx-auto space-y-12">
        <ScrollReveal y={24} blur={4}>
          <div className="text-center space-y-3">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#C8A96B]/20 text-[#C8A96B] text-xs font-extrabold uppercase tracking-wider">
              Paket Harga Subscription
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#2F332E]">
              Pilihan Paket Sesuai Skala Properti Anda
            </h2>
            <p className="text-xs md:text-sm text-gray-500 max-w-xl mx-auto">
              Mulai gratis, upgrade kapan saja sesuai pertumbuhan bisnis properti Anda.
            </p>
          </div>
        </ScrollReveal>

        {/* Pricing Cards — 1 col mobile, 2 col tablet, 4 col desktop */}
        {plansLoading ? (
          /* Skeleton Loader */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-[#C7D3C0]/40 bg-white p-6 space-y-4 animate-pulse"
              >
                <div className="h-4 w-20 bg-gray-100 rounded-full" />
                <div className="h-8 w-36 bg-gray-100 rounded-lg" />
                <div className="h-3 w-28 bg-gray-100 rounded-full" />
                <div className="mt-4 space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-3 w-full bg-gray-100 rounded-full" />
                  ))}
                </div>
                <div className="h-10 w-full bg-gray-100 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Paket langganan belum tersedia saat ini.
          </p>
        ) : (
          /* --- Plan Cards --- */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-5">
            {plans.map((plan) => {
              const isFree = plan.priceMonthly === 0;
              const isPopular = plan.isMostPopular;

              return (
                <div
                  key={plan.id}
                  className={[
                    "rounded-3xl p-6 flex flex-col justify-between relative transition-shadow duration-200",
                    isPopular
                      ? "border-2 border-[#C8A96B] bg-white shadow-xl mt-0"
                      : "border border-[#C7D3C0]/50 bg-white shadow-sm hover:shadow-md",
                  ].join(" ")}
                >
                  {/* Popular Badge — floats above card */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#C8A96B] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                        <Zap className="w-3 h-3" />
                        Paling Populer
                      </span>
                    </div>
                  )}

                  {/* ---- Card body ---- */}
                  <div className={["space-y-4 flex-1", isPopular ? "pt-3" : ""].join(" ")}>
                    {/* Plan name + Default badge */}
                    <div className="flex items-center gap-2 pt-1">
                      <h3 className="text-xl font-black text-[#2F332E] leading-none">
                        {plan.name}
                      </h3>
                      {plan.isDefault && (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[9px] font-bold uppercase tracking-wide">
                          Default
                        </span>
                      )}
                    </div>

                    {/* Pricing */}
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[#2F332E]">
                          {isFree
                            ? "Rp 0"
                            : `Rp ${plan.priceMonthly.toLocaleString("id-ID")}`}
                        </span>
                        <span className="text-xs text-gray-400 font-semibold">/bulan</span>
                      </div>
                      {!isFree && plan.priceYearlyPerMonth > 0 && plan.discountPercent > 0 && (
                        <p className="text-[11px] font-medium mt-0.5" style={{ color: "#009966" }}>
                          ~Rp {plan.priceYearlyPerMonth.toLocaleString("id-ID")}/bulan (opsi tahunan hemat {plan.discountPercent}%)
                        </p>
                      )}
                    </div>

                    {/* Quota metrics */}
                    <div className="rounded-2xl bg-[#F7F4ED] px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                          <Home className="w-3.5 h-3.5 text-[#8FA28A]" />
                          Properti
                        </span>
                        <span className="font-bold text-[#2F332E]">
                          {plan.maxProperties} Properti
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                          <Key className="w-3.5 h-3.5 text-[#8FA28A]" />
                          Kamar / Unit
                        </span>
                        <span className="font-bold text-[#2F332E]">
                          {plan.maxUnits} Kamar
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                          <Users className="w-3.5 h-3.5 text-[#8FA28A]" />
                          Housekeeping
                        </span>
                        <span className="font-bold text-[#2F332E]">
                          {plan.maxHousekeeping} Akun
                        </span>
                      </div>
                    </div>

                    {/* Feature list */}
                    {plan.features.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                          Fitur Sistem yang Termasuk:
                        </p>
                        <ul className="space-y-1.5">
                          {plan.features.map((feat, fi) => (
                            <li key={fi} className="flex items-start gap-2 text-xs text-gray-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#8FA28A] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div className="pt-5">
                    <Link
                      href="/login"
                      className={[
                        "w-full py-3 rounded-xl text-xs font-bold text-center transition-all block",
                        isPopular
                          ? "bg-[#C8A96B] hover:bg-[#C8A96B]/90 text-white shadow-sm"
                          : isFree
                          ? "border-2 border-[#8FA28A] text-[#8FA28A] hover:bg-[#8FA28A]/8"
                          : "bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white shadow-sm",
                      ].join(" ")}
                    >
                      {isFree ? `Mulai Gratis` : `Pilih Paket ${plan.name}`}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      
      </section>

      {/* ---------------------------------------------------------------- FAQ SECTION ---------------------------------------------------------------- */}
      {Object.keys(faqCategories).length > 0 && (
        <section id="faq" className="py-10 px-4 max-w-7xl mx-auto">
          <FAQ
            title="Frequently Asked Questions"
            description="Temukan jawaban atas berbagai pertanyaan yang sering diajukan mengenai Arventa. Kami telah merangkum informasi penting seputar fitur, layanan, dan penggunaan Arventa untuk membantu Anda mendapatkan informasi yang dibutuhkan dengan lebih cepat dan mudah."
            subtitle="FAQ"
            categories={faqCategories}
            faqData={faqData}
            className="py-0"
          />

          <div className="text-center mt-8">
            <ScrollReveal y={20} blur={4}>
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                Masih mempunyai pertanyaan? Hubungi kami melalui {" "}
                <a
                  href="mailto:arventa@gmail.com"
                  className="font-bold text-[#8FA28A] hover:underline transition-colors"
                >
                  arventa@gmail.com
                </a>
              </p>
              <p className="text-xs md:text-sm text-gray-500 font-medium">Kami siap membantu anda.</p>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- BOTTOM CTA BANNER ---------------------------------------------------------------- */}
      <section className="bg-[#242823] text-white py-16 md:py-20 px-4 text-center space-y-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <ScrollReveal y={24} blur={4}>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Kelola Semua Properti dalam Satu Platform
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1} y={16} blur={3}>
            <p className="text-xs md:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
              Gunakan ARVENTA sekarang untuk efisiensi operasional kos, apartemen, kontrakan, dan ruko Anda.
            </p>
          </ScrollReveal>
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
                ARVENTA
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
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <Link href="/login" className="hover:text-white transition-colors">
              Login
            </Link>
          </div>

          {/* Right Copyright */}
          <p className="text-gray-400 text-xs">
            © 2026 ARVENTA v{packageJson.version}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

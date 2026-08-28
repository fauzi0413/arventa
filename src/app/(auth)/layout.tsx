import React from "react";
import Link from "next/link";
import { Building2, Home, Building, Store, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import packageJson from "../../../package.json";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#F5F7F4] text-[#2F332E] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 size-96 rounded-full bg-[#8FA28A]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-[#C8A96B]/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Brand Graphic & Hero Section (Visible on Desktop / Large screens) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 flex-col justify-between p-8 xl:p-10 rounded-3xl border border-[#E1ECE0] bg-white/90 backdrop-blur-xl shadow-xl relative overflow-hidden min-h-[620px]">
          {/* Subtle Ambient Graphic Accents */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#8FA28A]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#C8A96B]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Section */}
          <div className="space-y-6 relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 group" title="Kembali ke Landing Page">
              <div className="h-12 w-12 rounded-full bg-[#6B8065] flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white group-hover:scale-105 transition-transform">
                A
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-widest text-[#2F332E] uppercase">
                  ARVENTA
                </h1>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#5B7555]">
                  &quot;KELOLA ASET DALAM GENGGAMAN&quot;
                </p>
              </div>
            </Link>

            {/* Asset Types Pills Row */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-700 font-bold pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F5EF] border border-[#D5E2D3]">
                <Home className="w-3.5 h-3.5 text-[#5B7555]" />
                Kos-kosan
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F5EF] border border-[#D5E2D3]">
                <Building2 className="w-3.5 h-3.5 text-[#5B7555]" />
                Apartemen
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F5EF] border border-[#D5E2D3]">
                <Building className="w-3.5 h-3.5 text-[#5B7555]" />
                Kontrakan
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F5EF] border border-[#D5E2D3]">
                <Store className="w-3.5 h-3.5 text-[#5B7555]" />
                Ruko
              </span>
            </div>
          </div>

          {/* Hero Feature Banner Card */}
          <div className="space-y-4 my-8 relative z-10">
            <h2 className="text-2xl xl:text-3xl font-black text-[#2F332E] leading-tight">
              Platform Manajemen Properti & SaaS Terintegrasi #1
            </h2>
            <p className="text-xs xl:text-sm text-gray-600 leading-relaxed font-medium">
              Otomatisasi pengolahan kamar, invoice penagihan penyewa, laporan keuangan real-time, dan tata kelola unit dalam satu dashboard terpadu.
            </p>

            <div className="space-y-3 pt-3">
              <div className="flex items-center gap-3 text-xs xl:text-sm text-[#2F332E] font-semibold">
                <div className="size-6 rounded-full bg-[#5B7555]/15 text-[#5B7555] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Monitoring status kamar & okupansi unit real-time</span>
              </div>
              <div className="flex items-center gap-3 text-xs xl:text-sm text-[#2F332E] font-semibold">
                <div className="size-6 rounded-full bg-[#5B7555]/15 text-[#5B7555] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Pengiriman reminder penagihan WhatsApp otomatis</span>
              </div>
              <div className="flex items-center gap-3 text-xs xl:text-sm text-[#2F332E] font-semibold">
                <div className="size-6 rounded-full bg-[#5B7555]/15 text-[#5B7555] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Audit log transaksi & analisis finansial SaaS</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Stat Bar */}
          <div className="border-t border-[#E1ECE0] pt-4 flex items-center justify-between text-xs relative z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#5B7555]" />
              <span className="text-gray-600 font-bold">Keamanan Terenkripsi Standard Bank</span>
            </div>
            <div className="flex items-center gap-1.5 font-black text-[#A88748]">
              <Sparkles className="w-4 h-4" />
              <span>ARVENTA v{packageJson.version}</span>
            </div>
          </div>
        </div>

        {/* Mobile Header Version (Only visible on small/medium screens) */}
        <div className="lg:hidden flex flex-col items-center space-y-3 mb-2 text-center">
          <Link href="/" className="flex items-center justify-center group" title="Kembali ke Landing Page">
            <div className="h-12 w-12 rounded-full bg-[#6B8065] flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white">
              A
            </div>
          </Link>
          <h1 className="text-xl font-black tracking-widest text-[#2F332E] uppercase">
            ARVENTA
          </h1>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#5B7555]">
            &quot;KELOLA ASET DALAM GENGGAMAN&quot;
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-gray-700 font-bold pt-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E1ECE0]">Kos-kosan</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E1ECE0]">Apartemen</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E1ECE0]">Kontrakan</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E1ECE0]">Ruko</span>
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="lg:col-span-6 xl:col-span-6 w-full max-w-lg mx-auto lg:max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}

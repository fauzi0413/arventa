import Link from "next/link";
import { IconBuilding, IconCheck, IconShieldCheck, IconSparkles, IconBed, IconChartBar } from "@tabler/icons-react";
import { ThemeToggle } from "@/components/auth/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full bg-background overflow-hidden">
      {/* Background Ambient Gradients */}
      <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 size-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Main Grid Container */}
      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-12">
        {/* Left Side — Branding & Features Hero (Hidden on small screens) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 size-96 rounded-full bg-indigo-500/15 blur-3xl" />

          {/* Brand Logo Header */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <IconBuilding className="size-6" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">ARVENTA</span>
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
                Property & Room Management System
              </p>
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 space-y-6 my-auto max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md">
              <IconSparkles className="size-4 text-amber-400" /> Platform Pengelolaan Kos & Apartemen
            </div>

            <h1 className="text-4xl font-black tracking-tight leading-tight text-white">
              Satu Aplikasi Untuk Seluruh Operasional Properti Anda
            </h1>

            <p className="text-base text-slate-300 leading-relaxed">
              Otomatisasi pengawasan hunian, pembayaran sewa bulanan, jadwal kebersihan kamar, dan laporan keuangan dalam satu dashboard terpadu.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
                <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
                  <IconBuilding className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Multi-Property Inventory</p>
                  <p className="text-[11px] text-slate-400">Kos, Apartemen, Kontrakan</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
                <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
                  <IconChartBar className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Keuangan & Invoice</p>
                  <p className="text-[11px] text-slate-400">Pencatatan Sewa & OpEx</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
                <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                  <IconSparkles className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Housekeeping Hub</p>
                  <p className="text-[11px] text-slate-400">Ops Grid & Status Kamar</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
                <div className="rounded-lg bg-purple-500/20 p-2 text-purple-400">
                  <IconBed className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Portal Penghuni</p>
                  <p className="text-[11px] text-slate-400">Tagihan & Kontrak Digital</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-white/10 pt-4">
            <span>© 2026 ARVENTA Platform</span>
            <span>v2.4 Role-Based Edition</span>
          </div>
        </div>

        {/* Right Side — Form Area */}
        <div className="col-span-12 lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          {/* Top Bar with Theme Toggle & Mobile Logo */}
          <div className="flex items-center justify-between w-full">
            <Link href="/" className="flex lg:hidden items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                A
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">ARVENTA</span>
            </Link>

            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          {/* Main Form Center */}
          <div className="my-auto py-8 w-full max-w-md mx-auto">
            {children}
          </div>

          {/* Bottom Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4">
            Keamanan Data Terenkripsi • Integrated Supabase Auth & PostgreSQL
          </div>
        </div>
      </div>
    </div>
  );
}

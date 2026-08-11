"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconBuilding,
  IconBed,
  IconUsers,
  IconCash,
  IconAlertCircle,
  IconPlus,
  IconFilePlus,
  IconReceipt,
  IconArrowUpRight,
  IconBuildingStore,
  IconSparkles,
  IconKey,
  IconQrcode,
  IconBrandWhatsapp,
  IconTrendingUp,
  IconFileText,
  IconUserCheck,
  IconTransfer,
  IconDownload,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OwnerDashboardProps {
  data: {
    user: { fullName: string; email: string };
    totalRevenueThisMonth: number;
    totalOpEx: number;
    netProfit: number;
    pendingAmount: number;
    totalProperties: number;
    totalUnits: number;
    activeLeasesCount: number;
    occupancyRate: number;
    statusBreakdown: {
      AVAILABLE: number;
      OCCUPIED: number;
      MAINTENANCE: number;
      CLEANING: number;
      RESERVED: number;
    };
    aiInsight: {
      title: string;
      summary: string;
      recommendation: string;
    };
    properties: Array<{
      id: string;
      name: string;
      type: string;
      address: string;
      totalUnits: number;
      occupiedUnits: number;
    }>;
    housekeepingTeam: Array<{
      id: string;
      name: string;
      phone: string;
      propertyName: string;
    }>;
    pendingInvoices: Array<{
      id: string;
      invoiceNumber: string;
      unitNumber: string;
      tenantName: string;
      tenantPhone?: string | null;
      totalAmount: number;
      dueDate: string;
      status: string;
    }>;
    recentExpenses: Array<{
      id: string;
      title: string;
      propertyName: string;
      amount: number;
      category: string;
      expenseDate: string;
    }>;
  };
}

export function OwnerDashboard({ data }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "units" | "team" | "tenants" | "finance">("overview");
  const [selectedUnitPasswordModal, setSelectedUnitPasswordModal] = useState<string | null>(null);

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Header Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 text-xs tracking-wide uppercase">
                <IconBuildingStore className="mr-1 size-3.5" /> Property Owner Workspace
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {data.user.fullName}
            </h1>
            <p className="mt-1 text-sm text-blue-200/80">
              Kelola aset properti, hunian penyewa, tim housekeeping, dan finansial net profit Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/properties"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "bg-primary text-primary-foreground font-semibold shadow-md gap-1.5"
              )}
            >
              <IconPlus className="size-4" /> Properti Baru
            </Link>
            <Link
              href="/finance"
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "font-semibold gap-1.5"
              )}
            >
              <IconFilePlus className="size-4" /> Catat OpEx
            </Link>
          </div>
        </div>
      </div>

      {/* Module Tabs Bar (No raw emojis in text labels) */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {[
          { id: "overview", label: "Dashboard Utama & AI Insight", icon: IconTrendingUp },
          { id: "units", label: "Properti & Manajemen Unit", icon: IconBuilding },
          { id: "team", label: "Tim Housekeeping & Assignment", icon: IconSparkles },
          { id: "tenants", label: "Penyewa & OCR Check-In", icon: IconUsers },
          { id: "finance", label: "Keuangan & Laporan OpEx", icon: IconCash },
        ].map((tab) => (
          <Button
            key={tab.id}
            size="sm"
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id as any)}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD UTAMA & FINANCIAL OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Pemasukan (Gross)
                  </span>
                  <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                    <IconCash className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">{formatIDR(data.totalRevenueThisMonth)}</p>
                  <span className="text-[11px] text-emerald-600 font-medium">Lunas Dari Tagihan Sewa</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Pengeluaran (OpEx)
                  </span>
                  <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-400">
                    <IconFilePlus className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatIDR(data.totalOpEx)}</p>
                  <span className="text-[11px] text-muted-foreground">Listrik, Air, & Perbaikan</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Net Profit (Bersih)
                  </span>
                  <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                    <IconTrendingUp className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatIDR(data.netProfit)}
                  </p>
                  <span className="text-[11px] text-emerald-600 font-bold">Pemasukan - OpEx</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Alert Tunggakan
                  </span>
                  <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                    <IconAlertCircle className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatIDR(data.pendingAmount)}</p>
                  <span className="text-[11px] text-muted-foreground">{data.pendingInvoices.length} tagihan menunggu</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 shadow-sm bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconSparkles className="size-5 text-amber-400 animate-pulse" />
                AI Financial & Occupancy Insight (Powered by Gemini)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="font-bold text-sm text-indigo-200">{data.aiInsight.title}</p>
              <p className="text-slate-300">{data.aiInsight.summary}</p>
              <div className="rounded-lg bg-white/10 p-3 text-amber-200 font-medium">
                💡 <strong>Rekomendasi AI:</strong> {data.aiInsight.recommendation}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconAlertCircle className="size-5 text-amber-500" />
                Alert Tagihan Jatuh Tempo (Overdue Payments)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {data.pendingInvoices.map((inv) => (
                <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                  <div>
                    <span className="font-bold text-foreground">Kamar {inv.unitNumber} • {inv.tenantName}</span>
                    <p className="text-muted-foreground">Invoice #{inv.invoiceNumber} • Jatuh Tempo: {new Date(inv.dueDate).toLocaleDateString("id-ID")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{formatIDR(inv.totalAmount)}</span>
                    <a
                      href={`https://wa.me/${inv.tenantPhone || "6281444444444"}?text=Halo%20${encodeURIComponent(inv.tenantName)},%20mengingatkan%20tagihan%20sewa%20Kamar%20${inv.unitNumber}%20sebesar%20${formatIDR(inv.totalAmount)}%20sudah%20jatuh%20tempo.`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 hover:bg-emerald-500"
                    >
                      <IconBrandWhatsapp className="size-3.5" /> Ingatkan WA
                    </a>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: PROPERTI & MANAJEMEN UNIT */}
      {activeTab === "units" && (
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconBuilding className="size-5 text-blue-600" />
                Detail Kamar & Room-Centric Account Management
              </CardTitle>
              <CardDescription>Reset password akun kamar, atur harga, dan share QR/WA login ke penghuni.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.properties.map((prop) => (
                  <div key={prop.id} className="rounded-xl border p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="text-[10px] mb-1">{prop.type}</Badge>
                        <h3 className="font-bold text-sm text-foreground">{prop.name}</h3>
                        <p className="text-xs text-muted-foreground">{prop.address}</p>
                      </div>
                      <Badge variant="default" className="text-[10px]">{prop.occupiedUnits}/{prop.totalUnits} Terisi</Badge>
                    </div>

                    <div className="pt-2 border-t flex flex-wrap gap-2 text-xs">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUnitPasswordModal(prop.name)}
                        className="text-xs h-8 gap-1"
                      >
                        <IconKey className="size-3.5" /> Reset Password Kamar
                      </Button>
                      <a
                        href={`https://wa.me/?text=Halo%20penghuni%20${encodeURIComponent(prop.name)},%20berikut%20link%20login%20portal%20kamar%20Anda:%20http://localhost:3000/login`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-semibold flex items-center gap-1 hover:bg-emerald-500/20"
                      >
                        <IconBrandWhatsapp className="size-3.5" /> Share WA Login
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: TIM HOUSEKEEPING & ASSIGNMENT */}
      {activeTab === "team" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconSparkles className="size-5 text-amber-500" />
              Penugasan Tim Housekeeping (Property Assignment)
            </CardTitle>
            <CardDescription>Mapping staf Housekeeping A → Properti X / Unit Y & Monitoring Lapangan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.housekeepingTeam.map((hk) => (
              <div key={hk.id} className="flex items-center justify-between border p-3.5 rounded-xl text-xs">
                <div>
                  <p className="font-bold text-foreground text-sm">{hk.name}</p>
                  <p className="text-muted-foreground">📱 {hk.phone} • Assigned: <span className="font-semibold text-primary">{hk.propertyName}</span></p>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-8">
                  Ubah Mapping Properti
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: PENYEWA & OCR CHECK-IN */}
      {activeTab === "tenants" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconUsers className="size-5 text-purple-600" />
                Data Penghuni & Check-In OCR KTP AI
              </CardTitle>
              <CardDescription>Tautkan penghuni baru, fitur pindah kamar, dan cetak kontrak PDF.</CardDescription>
            </div>
            <Button size="sm" className="font-semibold text-xs gap-1.5" onClick={() => alert("Simulasi OCR KTP AI Check-In dibuka")}>
              <IconUserCheck className="size-4" /> Check-In OCR KTP AI
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="rounded-lg border p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm text-foreground">Siti Rahmawati (Unit 101 - Kos Graha Asri)</p>
                <p className="text-muted-foreground">NIK: 3273012345670001 • Software Engineer</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => alert("Fitur Pindah Kamar ke Unit 102")}>
                  <IconTransfer className="size-3.5" /> Pindah Kamar
                </Button>
                <Button size="sm" variant="secondary" className="h-8 text-xs gap-1" onClick={() => alert("Mengunduh dokumen kontrak sewa PDF...")}>
                  <IconDownload className="size-3.5" /> Cetak PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: KEUANGAN & LAPORAN OPEX */}
      {activeTab === "finance" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconCash className="size-5 text-emerald-600" />
              Laporan Keuangan & Export OpEx
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex gap-2 mb-4">
              <Button size="sm" className="gap-1.5 text-xs font-semibold" onClick={() => alert("Exporting Laporan Keuangan ke Excel...")}>
                <IconDownload className="size-4" /> Export Excel
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold" onClick={() => alert("Exporting Laporan Keuangan ke PDF...")}>
                <IconFileText className="size-4" /> Export PDF
              </Button>
            </div>

            <div className="divide-y rounded-lg border">
              {data.recentExpenses.map((exp) => (
                <div key={exp.id} className="flex justify-between p-3">
                  <div>
                    <p className="font-bold text-foreground">{exp.title}</p>
                    <p className="text-[10px] text-muted-foreground">{exp.propertyName} • {exp.category}</p>
                  </div>
                  <span className="font-bold text-rose-600">{formatIDR(exp.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset Password Modal Simulation */}
      {selectedUnitPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Reset Password Akun Kamar</h3>
            <p className="text-xs text-muted-foreground">Properti: {selectedUnitPasswordModal}</p>
            <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
              <p className="font-bold">Password Kamar Baru: <span className="font-mono text-primary">ArventaPass2026!</span></p>
              <p className="text-[11px] text-muted-foreground">Kirim password baru ini langsung via WhatsApp ke penghuni kamar.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedUnitPasswordModal(null)}>Tutup</Button>
              <a
                href={`https://wa.me/?text=Password%20kamar%20Anda%20di%20${encodeURIComponent(selectedUnitPasswordModal)}%20telah%20direset:%20ArventaPass2026!`}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-500"
              >
                <IconBrandWhatsapp className="size-4" /> Share Password via WA
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

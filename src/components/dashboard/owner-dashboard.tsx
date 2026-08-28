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
  IconBuildingStore,
  IconSparkles,
  IconKey,
  IconBrandWhatsapp,
  IconTrendingUp,
  IconFileText,
  IconUserCheck,
  IconTransfer,
  IconDownload,
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
      {/* Header Hero Banner (ARVENTA Brand Dark Sage & Gold) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconBuildingStore className="mr-1 size-3.5 text-[#C8A96B]" /> PROPERTY OWNER WORKSPACE
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Selamat Datang, {data.user.fullName}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300">
              Kelola aset properti, hunian penyewa, tim housekeeping, dan finansial net profit Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/properties"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold shadow-md gap-1.5 rounded-xl text-xs h-9"
              )}
            >
              <IconPlus className="size-4" /> Properti Baru
            </Link>
            <Link
              href="/finance"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "font-bold gap-1.5 rounded-xl text-xs h-9 border-[#383E36] bg-[#1E221E] text-gray-200 hover:bg-[#383E36]"
              )}
            >
              <IconFilePlus className="size-4" /> Catat OpEx
            </Link>
          </div>
        </div>
      </div>

      {/* Module Tabs Bar (ARVENTA Sage Theme) */}
      <div className="flex flex-wrap gap-2 border-b border-[#C7D3C0]/40 pb-3">
        {[
          { id: "overview", label: "Dashboard Utama & AI Insight", icon: IconTrendingUp },
          { id: "units", label: "Properti & Manajemen Unit", icon: IconBuilding },
          { id: "team", label: "Tim Housekeeping & Assignment", icon: IconSparkles },
          { id: "tenants", label: "Penyewa & OCR Check-In", icon: IconUsers },
          { id: "finance", label: "Keuangan & Laporan OpEx", icon: IconCash },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs font-bold gap-1.5 h-9 rounded-xl transition-all ${
                isActive
                  ? "bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white shadow-sm"
                  : "border-[#C7D3C0]/60 hover:bg-[#C7D3C0]/20 text-gray-700 dark:text-gray-300 dark:border-[#383E36]"
              }`}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD UTAMA & FINANCIAL OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Pemasukan (Gross)
                  </span>
                  <div className="rounded-xl bg-[#8FA28A]/15 p-2.5 text-[#8FA28A]">
                    <IconCash className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-[#2F332E] dark:text-white">{formatIDR(data.totalRevenueThisMonth)}</p>
                  <span className="text-[11px] text-[#8FA28A] font-bold">Lunas Dari Tagihan Sewa</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pengeluaran (OpEx)
                  </span>
                  <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500">
                    <IconFilePlus className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatIDR(data.totalOpEx)}</p>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">Listrik, Air, & Perbaikan</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm border-l-4 border-l-[#8FA28A]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Net Profit (Bersih)
                  </span>
                  <div className="rounded-xl bg-[#8FA28A]/15 p-2.5 text-[#8FA28A]">
                    <IconTrendingUp className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-[#8FA28A]">
                    {formatIDR(data.netProfit)}
                  </p>
                  <span className="text-[11px] text-[#8FA28A] font-bold">Pemasukan - OpEx</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm border-l-4 border-l-[#C8A96B]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Alert Tunggakan
                  </span>
                  <div className="rounded-xl bg-[#C8A96B]/15 p-2.5 text-[#C8A96B]">
                    <IconAlertCircle className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-[#C8A96B]">{formatIDR(data.pendingAmount)}</p>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">{data.pendingInvoices.length} tagihan menunggu</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Financial & Occupancy Insight Card */}
          <Card className="rounded-2xl border border-[#383E36] bg-[#1E221E] text-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconSparkles className="size-5 text-[#C8A96B]" />
                AI Financial & Occupancy Insight (Powered by Gemini)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="font-bold text-sm text-[#8FA28A]">{data.aiInsight.title}</p>
              <p className="text-gray-300 leading-relaxed">{data.aiInsight.summary}</p>
              <div className="rounded-xl bg-[#242823] border border-[#383E36] p-3 text-[#C8A96B] font-bold">
                💡 <strong>Rekomendasi AI:</strong> {data.aiInsight.recommendation}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invoices Card */}
          <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                <IconAlertCircle className="size-5 text-[#C8A96B]" />
                Alert Tagihan Jatuh Tempo (Overdue Payments)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {data.pendingInvoices.map((inv) => (
                <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-[#C7D3C0]/40 dark:border-[#383E36] rounded-xl gap-2">
                  <div>
                    <span className="font-bold text-[#2F332E] dark:text-white">Kamar {inv.unitNumber} • {inv.tenantName}</span>
                    <p className="text-gray-500 dark:text-gray-400">Invoice #{inv.invoiceNumber} • Jatuh Tempo: {new Date(inv.dueDate).toLocaleDateString("id-ID")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#C8A96B] text-sm">{formatIDR(inv.totalAmount)}</span>
                    <a
                      href={`https://wa.me/${inv.tenantPhone || "6281444444444"}?text=Halo%20${encodeURIComponent(inv.tenantName)},%20mengingatkan%20tagihan%20sewa%20Kamar%20${inv.unitNumber}%20sebesar%20${formatIDR(inv.totalAmount)}%20sudah%20jatuh%20tempo.`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-[#8FA28A] text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 hover:bg-[#8FA28A]/90 shadow-sm"
                    >
                      <IconBrandWhatsapp className="size-4" /> Ingatkan WA
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
          <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                <IconBuilding className="size-5 text-[#8FA28A]" />
                Detail Kamar & Room-Centric Account Management
              </CardTitle>
              <CardDescription>Reset password akun kamar, atur harga, dan share QR/WA login ke penghuni.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.properties.map((prop) => (
                  <div key={prop.id} className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="text-[10px] mb-1 border-[#8FA28A] text-[#8FA28A]">{prop.type}</Badge>
                        <h3 className="font-bold text-sm text-[#2F332E] dark:text-white">{prop.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{prop.address}</p>
                      </div>
                      <Badge className="bg-[#8FA28A] text-white text-[10px]">{prop.occupiedUnits}/{prop.totalUnits} Terisi</Badge>
                    </div>

                    <div className="pt-2 border-t border-[#C7D3C0]/30 dark:border-[#383E36] flex flex-wrap gap-2 text-xs">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUnitPasswordModal(prop.name)}
                        className="text-xs h-8 gap-1 rounded-xl border-[#383E36]"
                      >
                        <IconKey className="size-3.5" /> Reset Password Kamar
                      </Button>
                      <a
                        href={`https://wa.me/?text=Halo%20penghuni%20${encodeURIComponent(prop.name)},%20berikut%20link%20login%20portal%20kamar%20Anda:%20http://localhost:3000/login`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-[#8FA28A]/40 bg-[#8FA28A]/10 text-[#8FA28A] px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 hover:bg-[#8FA28A]/20"
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
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
              <IconSparkles className="size-5 text-[#C8A96B]" />
              Penugasan Tim Housekeeping (Property Assignment)
            </CardTitle>
            <CardDescription>Mapping staf Housekeeping A → Properti X / Unit Y & Monitoring Lapangan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.housekeepingTeam.map((hk) => (
              <div key={hk.id} className="flex items-center justify-between border border-[#C7D3C0]/40 dark:border-[#383E36] p-3.5 rounded-xl text-xs">
                <div>
                  <p className="font-bold text-[#2F332E] dark:text-white text-sm">{hk.name}</p>
                  <p className="text-gray-500 dark:text-gray-400">📱 {hk.phone} • Assigned: <span className="font-bold text-[#8FA28A]">{hk.propertyName}</span></p>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-8 rounded-xl border-[#383E36]">
                  Ubah Mapping Properti
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: PENYEWA & OCR CHECK-IN */}
      {activeTab === "tenants" && (
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                <IconUsers className="size-5 text-[#8FA28A]" />
                Data Penghuni & Check-In OCR KTP AI
              </CardTitle>
              <CardDescription>Tautkan penghuni baru, fitur pindah kamar, dan cetak kontrak PDF.</CardDescription>
            </div>
            <Button size="sm" className="font-bold text-xs gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white" onClick={() => alert("Simulasi OCR KTP AI Check-In dibuka")}>
              <IconUserCheck className="size-4" /> Check-In OCR KTP AI
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm text-[#2F332E] dark:text-white">Siti Rahmawati (Unit 101 - Kos Graha Asri)</p>
                <p className="text-gray-500 dark:text-gray-400">NIK: 3273012345670001 • Software Engineer</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 rounded-xl" onClick={() => alert("Fitur Pindah Kamar ke Unit 102")}>
                  <IconTransfer className="size-3.5" /> Pindah Kamar
                </Button>
                <Button size="sm" className="h-8 text-xs gap-1 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold" onClick={() => alert("Mengunduh dokumen kontrak sewa PDF...")}>
                  <IconDownload className="size-3.5" /> Cetak PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: KEUANGAN & LAPORAN OPEX */}
      {activeTab === "finance" && (
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
              <IconCash className="size-5 text-[#8FA28A]" />
              Laporan Keuangan & Export OpEx
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex gap-2 mb-4">
              <Button size="sm" className="gap-1.5 text-xs font-bold rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white" onClick={() => alert("Exporting Laporan Keuangan ke Excel...")}>
                <IconDownload className="size-4" /> Export Excel
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold rounded-xl border-[#383E36]" onClick={() => alert("Exporting Laporan Keuangan ke PDF...")}>
                <IconFileText className="size-4" /> Export PDF
              </Button>
            </div>

            <div className="divide-y divide-[#C7D3C0]/30 dark:divide-[#383E36] rounded-xl border border-[#C7D3C0]/40 dark:border-[#383E36]">
              {data.recentExpenses.map((exp) => (
                <div key={exp.id} className="flex justify-between p-3.5">
                  <div>
                    <p className="font-bold text-[#2F332E] dark:text-white">{exp.title}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{exp.propertyName} • {exp.category}</p>
                  </div>
                  <span className="font-bold text-rose-500">{formatIDR(exp.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset Password Modal Simulation */}
      {selectedUnitPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#242823] border border-[#383E36] text-white shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Reset Password Akun Kamar</h3>
            <p className="text-xs text-gray-400">Properti: {selectedUnitPasswordModal}</p>
            <div className="rounded-xl bg-[#1E221E] border border-[#383E36] p-3.5 text-xs space-y-1">
              <p className="font-bold">Password Kamar Baru: <span className="font-mono text-[#8FA28A]">ArventaPass2026!</span></p>
              <p className="text-[11px] text-gray-400">Kirim password baru ini langsung via WhatsApp ke penghuni kamar.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" className="rounded-xl border-[#383E36] text-gray-300" onClick={() => setSelectedUnitPasswordModal(null)}>Tutup</Button>
              <a
                href={`https://wa.me/?text=Password%20kamar%20Anda%20di%20${encodeURIComponent(selectedUnitPasswordModal)}%20telah%20direset:%20ArventaPass2026!`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#8FA28A] text-white px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 hover:bg-[#8FA28A]/90 shadow-sm"
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

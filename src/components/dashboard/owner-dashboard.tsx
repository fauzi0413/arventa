"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useOwnerDashboardRealtime } from "@/hooks/useOwnerDashboardRealtime";
import Link from "next/link";
import {
  IconBuilding,
  IconBed,
  IconUsers,
  IconCash,
  IconAlertCircle,
  IconPlus,
  IconFilePlus,
  IconBuildingSkyscraper,
  IconSpray,
  IconKey,
  IconBrandWhatsapp,
  IconTrendingUp,
  IconFileText,
  IconUserCheck,
  IconTransfer,
  IconDownload,
  IconPhone,
  IconFilter,
  IconCalendar,
  IconRefresh,
  IconLoader2,
  IconSparkles,
  IconChartBar,
  IconPercentage,
  IconCheck,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MonthlyTrendItem {
  month: string;
  year: number;
  grossRevenue: number;
  expensesAmount: number;
  netIncome: number;
}

export interface OwnerDashboardProps {
  data: {
    user: { fullName: string; email: string };
    totalRevenueThisMonth: number;
    totalOpEx: number;
    netProfit: number;
    pendingAmount: number;
    totalProperties: number;
    scopedPropertiesCount?: number;
    totalUnits: number;
    occupiedUnitsCount?: number;
    activeLeasesCount: number;
    occupancyRate: number;
    statusBreakdown: {
      AVAILABLE: number;
      OCCUPIED: number;
      MAINTENANCE: number;
      CLEANING: number;
      RESERVED: number;
    };
    aiInsight?: {
      title: string;
      targetProperty?: string;
      summary: string;
      recommendation: string;
    };
    monthlyTrend?: MonthlyTrendItem[];
    allProperties?: Array<{
      id: string;
      name: string;
      type: string;
      address: string;
      totalUnits: number;
      occupiedUnits: number;
    }>;
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

export function OwnerDashboard({ data: initialData }: OwnerDashboardProps) {
  const [stats, setStats] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"overview" | "units" | "team" | "tenants" | "finance">("overview");
  const [selectedUnitPasswordModal, setSelectedUnitPasswordModal] = useState<string | null>(null);

  // Filters State
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<string>("THIS_MONTH");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Realtime & Auto-Sync State
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  // Owner ID — fetched once on mount for Supabase Realtime channel scoping
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // Ref to prevent initial duplicate fetch
  const isInitialMount = useRef(true);

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  // Helper to resolve preset dates
  const calculatePresetDates = useCallback((preset: string) => {
    const now = new Date();
    let s = "";
    let e = "";

    if (preset === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      s = start.toISOString().split("T")[0];
      e = end.toISOString().split("T")[0];
    } else if (preset === "LAST_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      s = start.toISOString().split("T")[0];
      e = end.toISOString().split("T")[0];
    } else if (preset === "THIS_YEAR") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      s = start.toISOString().split("T")[0];
      e = end.toISOString().split("T")[0];
    } else if (preset === "ALL") {
      s = "";
      e = "";
    }
    return { s, e };
  }, []);

  // Fetch Dashboard Stats Function
  const fetchDashboardStats = useCallback(
    async (propId: string, start: string, end: string, isManual = false) => {
      try {
        if (isManual) setIsRefreshing(true);
        const params = new URLSearchParams();
        if (propId && propId !== "all") params.append("propertyId", propId);
        if (start) params.append("startDate", start);
        if (end) params.append("endDate", end);

        const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setStats(json.data);
            setLastSyncTime(new Date());
          }
        }
      } catch (err) {
        console.warn("Realtime stats sync error:", err);
      } finally {
        if (isManual) setIsRefreshing(false);
      }
    },
    []
  );

  // Initialize Date Preset on component mount & fetch ownerId for Realtime
  useEffect(() => {
    const { s, e } = calculatePresetDates("THIS_MONTH");
    setStartDate(s);
    setEndDate(e);

    // Fetch current user ID for Supabase Realtime channel scoping
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.id) setOwnerId(json.data.id);
      })
      .catch(() => {});
  }, [calculatePresetDates]);

  // Supabase Realtime subscription — silent background refresh on DB changes
  const { status: realtimeStatus } = useOwnerDashboardRealtime({
    ownerId,
    enabled: isAutoSync,
    debounceMs: 800,
    onDataChange: useCallback(() => {
      fetchDashboardStats(selectedPropertyId, startDate, endDate, false);
    }, [fetchDashboardStats, selectedPropertyId, startDate, endDate]),
  });

  // Handle changes in property or date range
  const handlePropertyChange = (newPropId: string) => {
    setSelectedPropertyId(newPropId);
    fetchDashboardStats(newPropId, startDate, endDate, true);
  };

  const handlePresetChange = (newPreset: string) => {
    setDatePreset(newPreset);
    if (newPreset !== "CUSTOM") {
      const { s, e } = calculatePresetDates(newPreset);
      setStartDate(s);
      setEndDate(e);
      fetchDashboardStats(selectedPropertyId, s, e, true);
    }
  };

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      fetchDashboardStats(selectedPropertyId, startDate, endDate, true);
    }
  };

  // Manual Trigger Refresh
  const handleManualRefresh = () => {
    fetchDashboardStats(selectedPropertyId, startDate, endDate, true);
  };

  // Property list options
  const propertyOptions = stats.allProperties || stats.properties || [];

  // Monthly trend calculations for bar heights
  const monthlyTrendData = stats.monthlyTrend || [];
  const maxMonthlyVal = Math.max(
    1,
    ...monthlyTrendData.map((m) => Math.max(m.grossRevenue, m.expensesAmount, Math.max(0, m.netIncome)))
  );
  const yStepTop = maxMonthlyVal;
  const yStepMid = Math.round(maxMonthlyVal / 2);
  const activeMonth =
    hoveredMonthIndex !== null && monthlyTrendData[hoveredMonthIndex]
      ? monthlyTrendData[hoveredMonthIndex]
      : monthlyTrendData.length > 0
      ? monthlyTrendData[monthlyTrendData.length - 1]
      : null;

  const totalUnits = stats.totalUnits || 1;
  const occupiedUnits = stats.occupiedUnitsCount ?? stats.statusBreakdown?.OCCUPIED ?? 0;
  const currentOccupancy = stats.occupancyRate ?? Math.round((occupiedUnits / totalUnits) * 100);

  return (
    <div className="space-y-6 text-foreground">
      {/* --------------------------------------------------------------------- */}
      {/* 1. Header Hero Banner (ARVENTA Brand Dark Sage & Gold) */}
      {/* --------------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconBuildingSkyscraper className="mr-1 size-3.5 text-[#C8A96B]" /> PROPERTY OWNER WORKSPACE
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Selamat Datang, {stats.user.fullName}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300">
              Kelola portofolio properti, arus kas pemasukan, efisiensi OpEx, dan tingkat okupansi dalam satu dashboard realtime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/properties"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold shadow-md gap-1.5 rounded-xl text-xs h-9 min-h-[36px]"
              )}
            >
              <IconPlus className="size-4" /> Properti Baru
            </Link>
            <Link
              href="/finance/expenses"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "font-bold gap-1.5 rounded-xl text-xs h-9 min-h-[36px] border-[#383E36] bg-[#1E221E] text-gray-200 hover:bg-[#383E36]"
              )}
            >
              <IconFilePlus className="size-4" /> Catat OpEx
            </Link>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. Module Tabs Bar (ARVENTA Sage Theme) */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-wrap gap-2 border-b border-[#C7D3C0]/40 dark:border-[#383E36] pb-3">
        {[
          { id: "overview", label: "Dashboard Utama & AI Insight", icon: IconTrendingUp },
          { id: "units", label: "Properti & Manajemen Unit", icon: IconBuilding },
          { id: "team", label: "Tim Housekeeping & Assignment", icon: IconSpray },
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

      {/* ===================================================================== */}
      {/* TAB 1: DASHBOARD UTAMA & FINANCIAL OVERVIEW (ENHANCED) */}
      {/* ===================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* ----------------------------------------------------------------- */}
          {/* 3. TOOLBAR FILTER INTERAKTIF & REALTIME SYNC CONTROL */}
          {/* ----------------------------------------------------------------- */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Filters: 4-Column Grid — Filter Properti | Periode Analisis | Dari Tanggal | Sampai Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-1">

                {/* Column 1: Filter Properti */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground block">
                    Filter Properti
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => handlePropertyChange(e.target.value)}
                    className="w-full bg-background text-foreground border border-border rounded-xl text-xs font-bold py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#8FA28A] transition-all cursor-pointer h-9"
                  >
                    <option value="all">Semua Properti ({propertyOptions.length})</option>
                    {propertyOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Column 2: Periode Analisis */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground block">
                    Periode Analisis
                  </label>
                  <select
                    value={datePreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full bg-background text-foreground border border-border rounded-xl text-xs font-bold py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#8FA28A] transition-all cursor-pointer h-9"
                  >
                    <option value="THIS_MONTH">Bulan Ini ({new Date().toLocaleDateString("id-ID", { month: "long" })})</option>
                    <option value="LAST_MONTH">Bulan Lalu</option>
                    <option value="THIS_YEAR">Tahun Ini ({new Date().getFullYear()})</option>
                    <option value="ALL">Semua Waktu</option>
                    <option value="CUSTOM">Rentang Kustom</option>
                  </select>
                </div>

                {/* Column 3: Dari Tanggal */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground block">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset("CUSTOM");
                    }}
                    className="w-full bg-background text-foreground border border-border rounded-xl text-xs font-bold py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#8FA28A] transition-all h-9"
                  />
                </div>

                {/* Column 4: Sampai Tanggal */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground block">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset("CUSTOM");
                    }}
                    onBlur={() => {
                      if (startDate && endDate) {
                        handleCustomDateApply();
                      }
                    }}
                    className="w-full bg-background text-foreground border border-border rounded-xl text-xs font-bold py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#8FA28A] transition-all h-9"
                  />
                </div>
              </div>

              {/* Right Controls: Supabase Realtime Badge & Manual Refresh */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                {/* Supabase Realtime Status Badge */}
                <button
                  type="button"
                  onClick={() => setIsAutoSync(!isAutoSync)}
                  title={
                    realtimeStatus === "CONNECTED"
                      ? "Supabase Realtime aktif — data diperbarui otomatis saat ada perubahan. Klik untuk jeda."
                      : realtimeStatus === "CONNECTING"
                      ? "Menghubungkan ke Supabase Realtime..."
                      : realtimeStatus === "RECONNECTING"
                      ? "Mencoba sambung ulang ke Supabase Realtime..."
                      : realtimeStatus === "OFFLINE"
                      ? "Koneksi Realtime terputus. Klik untuk aktifkan kembali."
                      : "Supabase Realtime dijeda. Klik untuk aktifkan."
                  }
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    realtimeStatus === "CONNECTED"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : realtimeStatus === "CONNECTING" || realtimeStatus === "RECONNECTING"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    {realtimeStatus === "CONNECTED" && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    {(realtimeStatus === "CONNECTING" || realtimeStatus === "RECONNECTING") && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        realtimeStatus === "CONNECTED"
                          ? "bg-emerald-500"
                          : realtimeStatus === "CONNECTING" || realtimeStatus === "RECONNECTING"
                          ? "bg-amber-500"
                          : "bg-muted-foreground"
                      }`}
                    />
                  </span>
                  <span>
                    {realtimeStatus === "CONNECTED"
                      ? "Realtime Connected"
                      : realtimeStatus === "CONNECTING"
                      ? "Connecting..."
                      : realtimeStatus === "RECONNECTING"
                      ? "Reconnecting..."
                      : realtimeStatus === "OFFLINE"
                      ? "Realtime Offline"
                      : "Realtime Paused"}
                  </span>
                </button>

                {/* Instant Manual Refresh Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="rounded-xl border-border bg-background hover:bg-muted text-foreground text-xs font-bold gap-1.5 h-9 min-h-[36px]"
                >
                  <IconRefresh className={`size-3.5 text-[#8FA28A] ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>{isRefreshing ? "Memperbarui..." : "Segarkan Data"}</span>
                </Button>
              </div>
            </div>

            {/* Micro Info Status */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground">
              <span className="truncate">
                Cakupan Data:{" "}
                <strong className="text-foreground">
                  {selectedPropertyId === "all"
                    ? "Seluruh Portofolio Properti"
                    : propertyOptions.find((p) => p.id === selectedPropertyId)?.name || "Properti Terpilih"}
                </strong>{" "}
                • {datePreset === "THIS_MONTH" ? "Bulan Ini" : datePreset === "LAST_MONTH" ? "Bulan Lalu" : datePreset === "THIS_YEAR" ? "Tahun Ini" : datePreset === "ALL" ? "Semua Waktu" : `${startDate} s/d ${endDate}`}
              </span>
              <span className="shrink-0 ml-2 font-mono">
                Update: {lastSyncTime.toLocaleTimeString("id-ID")}
              </span>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* 4. FINANCIAL OVERVIEW: 5-CARDS KPI GRID (RESPONSIVE) */}
          {/* ----------------------------------------------------------------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Card 1: Total Pemasukan */}
            <Card className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground shadow-2xs">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Total Pemasukan
                  </span>
                  <div className="rounded-xl bg-[#8FA28A]/15 p-2 text-[#8FA28A]">
                    <IconCash className="size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-foreground">
                    {formatIDR(stats.totalRevenueThisMonth)}
                  </p>
                  <p className="text-[11px] text-[#8FA28A] font-bold mt-0.5">
                    Lunas Dari Invoice Sewa
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Pengeluaran (OpEx) */}
            <Card className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground shadow-2xs">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Beban Operasional (OpEx)
                  </span>
                  <div className="rounded-xl bg-rose-500/10 p-2 text-rose-500">
                    <IconFilePlus className="size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                    {formatIDR(stats.totalOpEx)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Utilitas, Staf, & Perawatan
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Net Profit (Bersih) */}
            <Card className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground shadow-2xs border-l-4 border-l-[#8FA28A]">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Net Profit (Laba Bersih)
                  </span>
                  <div className="rounded-xl bg-[#8FA28A]/15 p-2 text-[#8FA28A]">
                    <IconTrendingUp className="size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-[#8FA28A]">
                    {formatIDR(stats.netProfit)}
                  </p>
                  <p className="text-[11px] text-[#8FA28A] font-bold mt-0.5">
                    Pemasukan dikurangi OpEx
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Tingkat Okupansi (Occupancy Rate) */}
            <Card className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground shadow-2xs border-l-4 border-l-[#8FA28A]">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Tingkat Okupansi
                  </span>
                  <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                    <IconBed className="size-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl sm:text-2xl font-black text-foreground">
                      {currentOccupancy}%
                    </p>
                    <span className="text-xs font-bold text-muted-foreground">
                      ({occupiedUnits}/{totalUnits} Terisi)
                    </span>
                  </div>
                  {/* Progress Bar Visual */}
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-[#8FA28A] h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, currentOccupancy))}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Alert Tunggakan */}
            <Card className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground shadow-2xs border-l-4 border-l-[#C8A96B]">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Alert Tunggakan
                  </span>
                  <div className="rounded-xl bg-[#C8A96B]/15 p-2 text-[#C8A96B]">
                    <IconAlertCircle className="size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-[#C8A96B]">
                    {formatIDR(stats.pendingAmount)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {stats.pendingInvoices.length} invoice belum lunas
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* 5. AI FINANCIAL INSIGHT BANNER (ARVENTA SAGE & GOLD THEME) */}
          {/* ----------------------------------------------------------------- */}
          {stats.aiInsight && (
            <div className="rounded-3xl border border-emerald-200/80 dark:border-[#383E36] bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white dark:from-[#242823] dark:via-[#1F241F] dark:to-[#171A17] p-5 sm:p-6 shadow-xs space-y-3 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#8FA28A]/20 dark:bg-[#8FA28A]/30 text-[#8FA28A] shrink-0 shadow-2xs">
                    <IconSparkles className="size-5 text-[#C8A96B]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8FA28A]/20 text-[#8FA28A] border border-[#8FA28A]/30">
                        Gemini AI Financial Analyst
                      </span>
                      {stats.aiInsight.targetProperty && (
                        <span className="text-xs text-muted-foreground font-semibold truncate">
                          • {stats.aiInsight.targetProperty}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight mt-0.5">
                      {stats.aiInsight.title}
                    </h3>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {stats.aiInsight.summary}
              </p>

              {/* Recommendation Pill */}
              <div className="rounded-2xl border border-border bg-card/80 p-3 text-xs text-foreground flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[#C8A96B] mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#C8A96B] uppercase tracking-wider text-[10px] block">
                    Rekomendasi Strategis Bisnis
                  </span>
                  <span className="font-medium text-foreground leading-relaxed">
                    {stats.aiInsight.recommendation}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* 6. GRAFIK TREN KEUANGAN VISUAL (BAR CHART 6 BULAN - RESPONSIVE) */}
          {/* ----------------------------------------------------------------- */}
          <Card className="rounded-3xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground shadow-2xs">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm sm:text-base font-black flex items-center gap-2 text-foreground">
                    <IconChartBar className="size-5 text-[#8FA28A]" />
                    Grafik Tren Keuangan Bulanan
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Perbandingan Gross Pendapatan, OpEx, dan Laba Bersih historis 6 bulan terakhir.
                  </CardDescription>
                </div>

                {/* Legend & Active Month Inspector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Legend */}
                  <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-emerald-500 shadow-2xs" />
                      <span className="text-foreground">Gross Pendapatan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-rose-500 shadow-2xs" />
                      <span className="text-foreground">OpEx</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-blue-600 shadow-2xs" />
                      <span className="text-foreground">Net Profit</span>
                    </div>
                  </div>

                  {/* Active Month Live Badge */}
                  {activeMonth && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-muted/60 border border-border text-[11px] font-bold">
                      <span className="text-[#C8A96B] font-extrabold">{activeMonth.month} {activeMonth.year}</span>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="text-emerald-600 dark:text-emerald-400">+{formatIDR(activeMonth.grossRevenue)}</span>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="text-rose-600 dark:text-rose-400">-{formatIDR(activeMonth.expensesAmount)}</span>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="text-blue-600 dark:text-blue-400 font-extrabold">={formatIDR(activeMonth.netIncome)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {/* Horizontal Scrollable Container for Mobile Viewports */}
              <div className="overflow-x-auto pb-2 scrollbar-thin">
                <div className="min-w-[560px] relative pt-20 pb-4">
                  {/* Y-Axis Grid Lines & Background Markers */}
                  <div className="absolute inset-x-0 top-20 bottom-12 flex flex-col justify-between pointer-events-none pr-2">
                    {/* 100% Top Line */}
                    <div className="w-full flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold text-muted-foreground w-16 text-right shrink-0">
                        {formatIDR(yStepTop)}
                      </span>
                      <div className="w-full border-b border-dashed border-border/60" />
                    </div>

                    {/* 50% Mid Line */}
                    <div className="w-full flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold text-muted-foreground w-16 text-right shrink-0">
                        {formatIDR(yStepMid)}
                      </span>
                      <div className="w-full border-b border-dashed border-border/60" />
                    </div>

                    {/* 0% Baseline */}
                    <div className="w-full flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold text-muted-foreground w-16 text-right shrink-0">
                        Rp 0
                      </span>
                      <div className="w-full border-b border-border" />
                    </div>
                  </div>

                  {/* Grid Bars Columns (Plotted to the right of Y-axis labels) */}
                  <div className="ml-18 grid grid-cols-6 gap-2 sm:gap-4 items-end h-56 relative z-10">
                    {monthlyTrendData.map((m, idx) => {
                      const hasRev = m.grossRevenue > 0;
                      const hasExp = m.expensesAmount > 0;
                      const hasNet = m.netIncome > 0;

                      const revHeight = hasRev ? Math.max(6, (m.grossRevenue / maxMonthlyVal) * 100) : 0;
                      const expHeight = hasExp ? Math.max(6, (m.expensesAmount / maxMonthlyVal) * 100) : 0;
                      const netHeight = hasNet ? Math.max(6, (m.netIncome / maxMonthlyVal) * 100) : 0;

                      const isHovered = hoveredMonthIndex === idx;

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredMonthIndex(idx)}
                          onMouseLeave={() => setHoveredMonthIndex(null)}
                          className={`flex flex-col items-center justify-end h-full rounded-2xl p-1 transition-all duration-200 relative group cursor-pointer ${
                            isHovered ? "bg-muted/40" : "hover:bg-muted/20"
                          }`}
                        >
                          {/* Floating Tooltip Card (Safe from top clipping with plenty of headroom) */}
                          <div
                            className={`absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center rounded-2xl bg-slate-900/95 dark:bg-[#1E221E]/95 backdrop-blur-md text-white p-2.5 text-[10px] shadow-2xl z-30 whitespace-nowrap space-y-1 border border-slate-700 dark:border-[#383E36] pointer-events-none transition-all duration-200 ${
                              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 pb-0.5 w-full">
                              <p className="font-black text-[#C8A96B]">
                                {m.month} {m.year}
                              </p>
                              <span className="text-[9px] px-1 rounded-sm bg-slate-800 text-slate-300">
                                Tren #{idx + 1}
                              </span>
                            </div>
                            <div className="space-y-0.5 w-full text-left">
                              <p className="text-emerald-300 font-semibold flex justify-between gap-3">
                                <span>Gross:</span> <span>{formatIDR(m.grossRevenue)}</span>
                              </p>
                              <p className="text-rose-300 font-semibold flex justify-between gap-3">
                                <span>OpEx:</span> <span>{formatIDR(m.expensesAmount)}</span>
                              </p>
                              <p className="font-extrabold text-blue-300 flex justify-between gap-3 border-t border-slate-800 pt-0.5">
                                <span>Net:</span> <span>{formatIDR(m.netIncome)}</span>
                              </p>
                            </div>
                            {/* Downward triangle arrow */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-[#1E221E] border-r border-b border-slate-700 dark:border-[#383E36] rotate-45" />
                          </div>

                          {/* Grouped Vertical Bars */}
                          <div className="flex items-end gap-1.5 w-full justify-center h-44 pb-0.5">
                            {/* Revenue Bar */}
                            <div
                              style={{ height: `${revHeight}%` }}
                              className={`w-1/3 max-w-[20px] rounded-t-md transition-all duration-300 shadow-2xs ${
                                hasRev
                                  ? "bg-emerald-500 group-hover:bg-emerald-600"
                                  : "h-0 opacity-0"
                              }`}
                            />
                            {/* Expense Bar */}
                            <div
                              style={{ height: `${expHeight}%` }}
                              className={`w-1/3 max-w-[20px] rounded-t-md transition-all duration-300 shadow-2xs ${
                                hasExp
                                  ? "bg-rose-500 group-hover:bg-rose-600"
                                  : "h-0 opacity-0"
                              }`}
                            />
                            {/* Net Income Bar */}
                            <div
                              style={{ height: `${netHeight}%` }}
                              className={`w-1/3 max-w-[20px] rounded-t-md transition-all duration-300 shadow-2xs ${
                                hasNet
                                  ? "bg-blue-600 group-hover:bg-blue-700"
                                  : "h-0 opacity-0"
                              }`}
                            />
                          </div>

                          {/* Month Label */}
                          <div className="pt-2 text-center">
                            <span className={`text-xs font-black block transition-colors ${
                              isHovered ? "text-foreground font-extrabold" : "text-muted-foreground"
                            }`}>
                              {m.month}
                            </span>
                            <span className="text-[9px] text-muted-foreground/70 block">
                              {m.year}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ----------------------------------------------------------------- */}
          {/* 7. ALERT TAGIHAN JATUH TEMPO (OVERDUE PAYMENTS - RESPONSIVE) */}
          {/* ----------------------------------------------------------------- */}
          <Card className="rounded-3xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground shadow-2xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                  <IconAlertCircle className="size-5 text-[#C8A96B]" />
                  Alert Tagihan Jatuh Tempo (Overdue Payments)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Invoice penyewa yang belum dilunasi. Kirim pesan pengingat langsung via WhatsApp.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-[#C8A96B] text-[#C8A96B] text-[10px] font-bold">
                {stats.pendingInvoices.length} Tagihan
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {stats.pendingInvoices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs space-y-1">
                  <IconCheck className="size-8 mx-auto text-emerald-500 mb-1" />
                  <p className="font-bold text-foreground">Semua Tagihan Tertib & Lunas</p>
                  <p className="text-[11px]">Tidak ada tunggakan pembayaran sewa pada periode ini.</p>
                </div>
              ) : (
                stats.pendingInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-[#C7D3C0]/40 dark:border-[#383E36] rounded-2xl gap-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">
                          Kamar {inv.unitNumber} • {inv.tenantName}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            inv.status === "OVERDUE"
                              ? "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 text-[9px]"
                              : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[9px]"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        Invoice #{inv.invoiceNumber} • Jatuh Tempo:{" "}
                        {new Date(inv.dueDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                      <span className="font-black text-[#C8A96B] text-sm sm:text-base">
                        {formatIDR(inv.totalAmount)}
                      </span>
                      <a
                        href={`https://wa.me/${
                          inv.tenantPhone || "6281444444444"
                        }?text=Halo%20${encodeURIComponent(
                          inv.tenantName
                        )},%20mengingatkan%20tagihan%20sewa%20Kamar%20${
                          inv.unitNumber
                        }%20sebesar%20${formatIDR(inv.totalAmount)}%20sudah%20jatuh%20tempo.`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all shrink-0 min-h-[36px]"
                      >
                        <IconBrandWhatsapp className="size-4" /> Ingatkan WA
                      </a>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PROPERTI & MANAJEMEN UNIT */}
      {/* ===================================================================== */}
      {activeTab === "units" && (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <IconBuilding className="size-5 text-[#8FA28A]" />
                Detail Kamar & Room-Centric Account Management
              </CardTitle>
              <CardDescription>Reset password akun kamar, atur harga, dan share QR/WA login ke penghuni.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {stats.properties.map((prop) => (
                  <div key={prop.id} className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="text-[10px] mb-1 border-[#8FA28A] text-[#8FA28A]">{prop.type}</Badge>
                        <h3 className="font-bold text-sm text-foreground">{prop.name}</h3>
                        <p className="text-xs text-muted-foreground">{prop.address}</p>
                      </div>
                      <Badge className="bg-[#8FA28A] text-white text-[10px]">{prop.occupiedUnits}/{prop.totalUnits} Terisi</Badge>
                    </div>

                    <div className="pt-2 border-t border-[#C7D3C0]/30 dark:border-[#383E36] flex flex-wrap gap-2 text-xs">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUnitPasswordModal(prop.name)}
                        className="text-xs h-8 gap-1 rounded-xl border-border"
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

      {/* ===================================================================== */}
      {/* TAB 3: TIM HOUSEKEEPING & ASSIGNMENT */}
      {/* ===================================================================== */}
      {activeTab === "team" && (
        <Card className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <IconSpray className="size-5 text-[#C8A96B]" />
              Penugasan Tim Housekeeping (Property Assignment)
            </CardTitle>
            <CardDescription>Mapping staf Housekeeping A → Properti X / Unit Y & Monitoring Lapangan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.housekeepingTeam.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Belum ada tim housekeeping yang terdaftar.</p>
            ) : (
              stats.housekeepingTeam.map((hk) => (
                <div key={hk.id} className="flex items-center justify-between border border-[#C7D3C0]/40 dark:border-[#383E36] p-3.5 rounded-xl text-xs">
                  <div>
                    <p className="font-bold text-foreground text-sm">{hk.name}</p>
                    <p className="text-muted-foreground flex items-center gap-1 mt-0.5"><IconPhone className="size-3 text-[#8FA28A] shrink-0" /> {hk.phone} • Assigned: <span className="font-bold text-[#8FA28A]">{hk.propertyName}</span></p>
                  </div>
                  <Link href="/operations/housekeeping-team">
                    <Button size="sm" variant="outline" className="text-xs h-8 rounded-xl border-border">
                      Kelola Penugasan
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PENYEWA & OCR CHECK-IN */}
      {/* ===================================================================== */}
      {activeTab === "tenants" && (
        <Card className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <IconUsers className="size-5 text-[#8FA28A]" />
                Data Penghuni & Check-In OCR KTP AI
              </CardTitle>
              <CardDescription>Tautkan penghuni baru, fitur pindah kamar, dan cetak kontrak PDF.</CardDescription>
            </div>
            <Link href="/tenants">
              <Button size="sm" className="font-bold text-xs gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white">
                <IconUserCheck className="size-4" /> Kelola Penyewa
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm text-foreground">Siti Rahmawati (Unit 101 - Kos Graha Asri)</p>
                <p className="text-muted-foreground">NIK: 3273012345670001 • Software Engineer</p>
              </div>
              <div className="flex gap-2">
                <Link href="/tenants">
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1 rounded-xl">
                    <IconTransfer className="size-3.5" /> Pindah Kamar
                  </Button>
                </Link>
                <Link href="/tenant-contract">
                  <Button size="sm" className="h-8 text-xs gap-1 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold">
                    <IconDownload className="size-3.5" /> Kontrak PDF
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: KEUANGAN & LAPORAN OPEX */}
      {/* ===================================================================== */}
      {activeTab === "finance" && (
        <Card className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-card text-card-foreground shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <IconCash className="size-5 text-[#8FA28A]" />
              Laporan Keuangan & Export OpEx
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex gap-2 mb-4">
              <Link href="/reports">
                <Button size="sm" className="gap-1.5 text-xs font-bold rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white">
                  <IconDownload className="size-4" /> Buka Laporan Lengkap & Ekspor
                </Button>
              </Link>
              <Link href="/finance/expenses">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold rounded-xl border-border">
                  <IconFileText className="size-4" /> Manajemen OpEx
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-[#C7D3C0]/30 dark:divide-[#383E36] rounded-xl border border-[#C7D3C0]/40 dark:border-[#383E36]">
              {stats.recentExpenses.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">Belum ada pengeluaran yang tercatat pada periode ini.</p>
              ) : (
                stats.recentExpenses.map((exp) => (
                  <div key={exp.id} className="flex justify-between p-3.5">
                    <div>
                      <p className="font-bold text-foreground">{exp.title}</p>
                      <p className="text-[10px] text-muted-foreground">{exp.propertyName} • {exp.category}</p>
                    </div>
                    <span className="font-bold text-rose-500">{formatIDR(exp.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Reset Password Modal Simulation */}
      {/* --------------------------------------------------------------------- */}
      {selectedUnitPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#242823] border border-[#383E36] text-white shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Reset Password Akun Kamar</h3>
            <p className="text-xs text-gray-400">Properti: {selectedUnitPasswordModal}</p>
            <div className="rounded-xl bg-[#1E221E] border border-[#383E36] p-3.5 text-xs space-y-1">
              <p className="font-bold">
                Password Kamar Baru: <span className="font-mono text-[#8FA28A]">ArventaPass2026!</span>
              </p>
              <p className="text-[11px] text-gray-400">
                Kirim password baru ini langsung via WhatsApp ke penghuni kamar.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-[#383E36] text-gray-300"
                onClick={() => setSelectedUnitPasswordModal(null)}
              >
                Tutup
              </Button>
              <a
                href={`https://wa.me/?text=Password%20kamar%20Anda%20di%20${encodeURIComponent(
                  selectedUnitPasswordModal
                )}%20telah%20direset:%20ArventaPass2026!`}
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

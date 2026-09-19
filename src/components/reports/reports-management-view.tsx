"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  IconChartBar,
  IconCoin,
  IconBuilding,
  IconUsers,
  IconTools,
  IconCalendar,
  IconFilter,
  IconDownload,
  IconPrinter,
  IconRefresh,
  IconLoader2,
  IconSparkles,
  IconTrendingUp,
  IconTrendingDown,
  IconCheck,
  IconAlertCircle,
  IconClock,
  IconFileText,
  IconArrowUpRight,
  IconChevronRight,
  IconBed,
  IconReceipt,
  IconAlertTriangle,
  IconPercentage,
  IconWallet,
  IconShieldCheck,
  IconArrowDownRight,
} from "@tabler/icons-react";

interface PropertyOption {
  id: string;
  name: string;
}

type ReportType = "financial" | "occupancy" | "tenant" | "operational";

const CATEGORY_NAMES: Record<string, string> = {
  MAINTENANCE: "Perbaikan & Perawatan",
  UTILITY: "Utilitas (Listrik & Air)",
  HOUSEKEEPING_SALARY: "Gaji & Insentif Staf",
  SUPPLIES: "Perlengkapan & Kebersihan",
  TAX_PBB: "Pajak & PBB",
  OTHER: "Lain-lain Operasional",
};

export function ReportsManagementView() {
  const [activeTab, setActiveTab] = useState<ReportType>("financial");
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("ALL");

  // Date Presets & Range
  const [datePreset, setDatePreset] = useState("THIS_MONTH");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set date preset ranges
  const applyDatePreset = useCallback((preset: string) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    } else if (preset === "LAST_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    } else if (preset === "THIS_YEAR") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    } else if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    }
  }, []);

  useEffect(() => {
    applyDatePreset("THIS_MONTH");
  }, [applyDatePreset]);

  // Fetch properties assigned to logged-in user
  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties?limit=100");
      const json = await res.json();
      if (res.ok && json.success) {
        setProperties(json.data.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (err) {
      console.error("Gagal memuat properti:", err);
    }
  }, []);

  // Fetch report data based on active tab and filters
  const fetchReportData = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else {
          setLoading(true);
          setReportData(null);
        }

        setError(null);
        const params = new URLSearchParams();
        params.append("type", activeTab);
        if (selectedPropertyId !== "ALL") params.append("propertyId", selectedPropertyId);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const res = await fetch(`/api/reports?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal memuat data laporan.");
        }

        setReportData(json.data || null);
      } catch (err: any) {
        console.error("Error fetching report:", err);
        setError(err.message || "Terjadi kesalahan sistem saat memuat data laporan.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, selectedPropertyId, startDate, endDate]
  );

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Currency Formatter
  const formatIDR = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Date Formatter
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Render MoM Growth Badge
  const renderTrendBadge = (val?: number, label = "vs bln lalu") => {
    if (val === undefined || val === null) return null;
    const isPositive = val >= 0;
    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${
          isPositive
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-rose-50 text-rose-700 border-rose-200"
        }`}
      >
        {isPositive ? <IconTrendingUp className="h-3 w-3" /> : <IconTrendingDown className="h-3 w-3" />}
        <span>
          {isPositive ? `+${val}%` : `${val}%`} {label}
        </span>
      </span>
    );
  };

  // Export Table to CSV
  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    const filename = `Laporan_Owner_${activeTab.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === "financial" && reportData.propertyBreakdown) {
      csvContent += "Nama Properti,Gross Pendapatan (IDR),Pengeluaran OpEx (IDR),Laba Bersih (IDR),Profit Margin (%),Revenue Share (%)\n";
      reportData.propertyBreakdown.forEach((row: any) => {
        csvContent += `"${row.propertyName}",${row.grossIncome},${row.expensesAmount},${row.netIncome},${row.profitMargin}%,${row.revenueShare}%\n`;
      });
    } else if (activeTab === "occupancy" && reportData.propertyBreakdown) {
      csvContent += "Nama Properti,Total Unit,Unit Terisi,Unit Kosong,Unit Perawatan,Tingkat Okupansi (%)\n";
      reportData.propertyBreakdown.forEach((row: any) => {
        csvContent += `"${row.propertyName}",${row.totalUnits},${row.occupiedUnits},${row.availableUnits},${row.maintenanceUnits},${row.occupancyRate}%\n`;
      });
    } else if (activeTab === "tenant" && reportData.leases) {
      csvContent += "Nama Penyewa,Telepon,Properti,Unit,Sewa Bulanan (IDR),Tanggal Mulai,Tanggal Selesai,Deposit (IDR),Status\n";
      reportData.leases.forEach((l: any) => {
        csvContent += `"${l.tenant?.fullName || "-"}","${l.tenant?.phoneNumber || "-"}","${l.unit?.property?.name || "-"}","Unit ${l.unit?.unitNumber || "-"}",${l.rentPrice},${formatDate(l.startDate)},${formatDate(l.endDate)},${l.securityDeposit},${l.status}\n`;
      });
    } else if (activeTab === "operational" && reportData.tickets) {
      csvContent += "No Tiket,Judul,Properti,Unit,Prioritas,Biaya Perbaikan (IDR),Status,Tanggal\n";
      reportData.tickets.forEach((t: any) => {
        csvContent += `"${t.ticketNumber}","${t.title}","${t.property?.name || "-"}","Unit ${t.unit?.unitNumber || "-"}","${t.priority}",${t.actualCost || 0},"${t.status}",${formatDate(t.createdAt)}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Find max value for monthly chart scaling
  const maxMonthlyVal = reportData?.monthlyTrend
    ? Math.max(
        ...reportData.monthlyTrend.map((m: any) =>
          Math.max(m.grossRevenue || 0, m.expensesAmount || 0, m.netIncome || 0)
        ),
        1000000
      )
    : 1000000;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* --------------------------------------------------------------------- */}
      {/* HEADER & CONTROLS TOOLBAR */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Laporan & Analytics
            </h1>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider">
              Wawasan Owner
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Analisis tren bisnis kos/properti: pendapatan, profit margin, piutang, okupansi, dan perbandingan grafik 6 bulan.
          </p>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            suppressHydrationWarning
            onClick={() => fetchReportData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <IconRefresh className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Memuat..." : "Refresh"}</span>
          </button>

          <button
            onClick={exportToCSV}
            disabled={loading || !reportData}
            className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-black text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <IconDownload className="h-4 w-4" />
            <span>Export Excel / CSV</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={loading || !reportData}
            className="flex items-center gap-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-black text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <IconPrinter className="h-4 w-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* FILTER TOOLBAR (PROPERTIES & DATE RANGE) */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Property Dropdown Selector */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Filter Properti
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs font-bold text-gray-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="ALL">Semua Properti ({properties.length})</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Preset Selector */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Periode Analisis
            </label>
            <select
              value={datePreset}
              onChange={(e) => applyDatePreset(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs font-bold text-gray-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="THIS_MONTH">Bulan Ini ({new Date().toLocaleDateString("id-ID", { month: "long" })})</option>
              <option value="LAST_MONTH">Bulan Lalu</option>
              <option value="THIS_YEAR">Tahun Ini ({new Date().getFullYear()})</option>
              <option value="ALL">Semua Periode Data</option>
              <option value="CUSTOM">Custom Rentang Tanggal</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setDatePreset("CUSTOM");
                setStartDate(e.target.value);
              }}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs font-bold text-gray-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setDatePreset("CUSTOM");
                setEndDate(e.target.value);
              }}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs font-bold text-gray-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4 MAIN REPORT CATEGORY CARDS */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {/* Card 1: Laporan Keuangan */}
        <button
          onClick={() => setActiveTab("financial")}
          className={`text-left rounded-3xl border p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === "financial"
              ? "border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20"
              : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-xs"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                <IconCoin className="h-5 w-5" />
              </span>
              {activeTab === "financial" && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
            </div>
            <h2 className="text-base font-black text-gray-900 mt-2">Laporan Keuangan</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Ringkasan pendapatan sewa, OpEx, profit margin, tren bulanan, dan piutang.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100/60 flex items-center justify-between text-[11px] font-bold text-emerald-700">
            <span>Buka Laporan & Grafik</span>
            <IconChevronRight className="h-4 w-4" />
          </div>
        </button>

        {/* Card 2: Laporan Okupansi */}
        <button
          onClick={() => setActiveTab("occupancy")}
          className={`text-left rounded-3xl border p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === "occupancy"
              ? "border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
              : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-xs"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
                <IconBed className="h-5 w-5" />
              </span>
              {activeTab === "occupancy" && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
            </div>
            <h2 className="text-base font-black text-gray-900 mt-2">Laporan Okupansi</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tingkat hunian unit kamar, potensi pendapatan maksimal, dan vacancy loss.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100/60 flex items-center justify-between text-[11px] font-bold text-blue-700">
            <span>Buka Laporan</span>
            <IconChevronRight className="h-4 w-4" />
          </div>
        </button>

        {/* Card 3: Laporan Penyewa */}
        <button
          onClick={() => setActiveTab("tenant")}
          className={`text-left rounded-3xl border p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === "tenant"
              ? "border-purple-500 bg-purple-50/50 shadow-md ring-2 ring-purple-500/20"
              : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-xs"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                <IconUsers className="h-5 w-5" />
              </span>
              {activeTab === "tenant" && <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />}
            </div>
            <h2 className="text-base font-black text-gray-900 mt-2">Laporan Penyewa</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Data penyewa, kontrak aktif, kadaluarsa sewa soon, dan total deposit.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100/60 flex items-center justify-between text-[11px] font-bold text-purple-700">
            <span>Buka Laporan</span>
            <IconChevronRight className="h-4 w-4" />
          </div>
        </button>

        {/* Card 4: Laporan Operasional */}
        <button
          onClick={() => setActiveTab("operational")}
          className={`text-left rounded-3xl border p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === "operational"
              ? "border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20"
              : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-xs"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                <IconTools className="h-5 w-5" />
              </span>
              {activeTab === "operational" && <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />}
            </div>
            <h2 className="text-base font-black text-gray-900 mt-2">Laporan Operasional</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tugas perbaikan maintenance, tingkat penyelesaian, dan biaya perbaikan.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100/60 flex items-center justify-between text-[11px] font-bold text-amber-700">
            <span>Buka Laporan</span>
            <IconChevronRight className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* EXECUTIVE INSIGHTS BANNER FOR OWNER */}
      {/* --------------------------------------------------------------------- */}
      {reportData && reportData.executiveInsights && reportData.executiveInsights.length > 0 && (
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-lg space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <IconSparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white">
                Executive Insights & Rekomendasi Bisnis Owner
              </h3>
              <p className="text-[11px] text-slate-300">
                Ringkasan analisis otomatis berbasis data transaksi dan okupansi terkini.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {reportData.executiveInsights.map((insight: string, idx: number) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md text-xs text-slate-200 flex items-start gap-2.5"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed font-medium">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* REPORT CONTENT BODY */}
      {/* --------------------------------------------------------------------- */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
          <IconAlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 flex flex-col items-center justify-center space-y-3 text-gray-400">
          <IconLoader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-semibold">Mengolah wawasan & statistik data laporan...</p>
        </div>
      ) : !reportData ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-gray-500 space-y-2">
          <p className="font-bold text-base text-gray-800">Tidak ada data untuk ditampilkan</p>
          <p className="text-xs text-gray-500">Coba ubah kriteria filter properti atau periode tanggal di atas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ================================================================= */}
          {/* TAB 1: LAPORAN KEUANGAN */}
          {/* ================================================================= */}
          {activeTab === "financial" && (
            <div className="space-y-6">
              {/* Financial Executive Metric Cards with MoM Trend Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      Gross Pendapatan (Lunas)
                    </span>
                    {renderTrendBadge(reportData.momTrends?.revenueGrowth)}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-900">{formatIDR(reportData.summary?.grossRevenue)}</p>
                    <p className="text-xs text-emerald-700/80 font-medium">
                      {reportData.summary?.paidInvoiceCount || 0} Invoice Terbayar
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5 shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                      Laba Bersih & Profit Margin
                    </span>
                    {renderTrendBadge(reportData.momTrends?.netIncomeGrowth)}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-blue-900">{formatIDR(reportData.summary?.netIncome)}</p>
                      <span className="rounded-md bg-blue-200 text-blue-900 px-1.5 py-0.5 text-xs font-black">
                        {reportData.summary?.profitMargin}%
                      </span>
                    </div>
                    <p className="text-xs text-blue-700/80 font-medium">Margin Keuntungan Bersih</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-rose-100 bg-rose-50/40 p-5 shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                      Total Pengeluaran (OpEx)
                    </span>
                    {renderTrendBadge(reportData.momTrends?.expenseGrowth)}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-rose-900">{formatIDR(reportData.summary?.totalExpenses)}</p>
                    <p className="text-xs text-rose-700/80 font-medium">
                      {reportData.summary?.expenseCount || 0} Biaya Operasional
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-5 shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                      Total Piutang Belum Terbayar
                    </span>
                    <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5">
                      {reportData.summary?.pendingCount || 0} Invoice
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-amber-900">{formatIDR(reportData.summary?.pendingRevenue)}</p>
                    <p className="text-xs text-amber-700/80 font-medium">Pending & Overdue Invoices</p>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* VISUAL CHART: MONTHLY REVENUE VS OPEX COMPARISON (6 MONTHS) */}
              {/* ----------------------------------------------------------------- */}
              {reportData.monthlyTrend && reportData.monthlyTrend.length > 0 && (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                        <IconChartBar className="h-4 w-4 text-emerald-600" />
                        <span>Grafik Perbandingan Keuangan Bulanan (6 Bulan Terakhir)</span>
                      </h3>
                      <p className="text-xs text-gray-500">
                        Perbandingan Gross Pendapatan, Biaya OpEx, dan Laba Bersih per bulan.
                      </p>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-md bg-emerald-500" />
                        <span className="text-gray-700">Gross Pendapatan</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-md bg-rose-500" />
                        <span className="text-gray-700">OpEx</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-md bg-blue-600" />
                        <span className="text-gray-700">Laba Bersih</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Bar Chart Graphic */}
                  <div className="pt-4 pb-2">
                    <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-56 px-2">
                      {reportData.monthlyTrend.map((m: any, idx: number) => {
                        const revHeight = Math.max(8, (m.grossRevenue / maxMonthlyVal) * 100);
                        const expHeight = Math.max(8, (m.expensesAmount / maxMonthlyVal) * 100);
                        const netHeight = Math.max(8, (Math.max(0, m.netIncome) / maxMonthlyVal) * 100);

                        return (
                          <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                            {/* Hover Tooltip Card */}
                            <div className="absolute -top-24 hidden group-hover:flex flex-col rounded-2xl bg-slate-900 p-2.5 text-white text-[10px] shadow-xl z-20 whitespace-nowrap space-y-0.5 border border-slate-700">
                              <p className="font-bold text-emerald-400">
                                {m.month} {m.year}
                              </p>
                              <p>Gross: {formatIDR(m.grossRevenue)}</p>
                              <p>OpEx: {formatIDR(m.expensesAmount)}</p>
                              <p className="font-bold text-blue-300">Laba: {formatIDR(m.netIncome)}</p>
                            </div>

                            {/* Grouped Vertical Bars */}
                            <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-44 border-b border-gray-100 pb-1">
                              {/* Revenue Bar */}
                              <div
                                style={{ height: `${revHeight}%` }}
                                className="w-1/3 max-w-[16px] rounded-t-lg bg-emerald-500 group-hover:bg-emerald-600 transition-all shadow-2xs"
                              />
                              {/* Expense Bar */}
                              <div
                                style={{ height: `${expHeight}%` }}
                                className="w-1/3 max-w-[16px] rounded-t-lg bg-rose-500 group-hover:bg-rose-600 transition-all shadow-2xs"
                              />
                              {/* Net Income Bar */}
                              <div
                                style={{ height: `${netHeight}%` }}
                                className="w-1/3 max-w-[16px] rounded-t-lg bg-blue-600 group-hover:bg-blue-700 transition-all shadow-2xs"
                              />
                            </div>

                            {/* Month Label */}
                            <span className="text-[11px] font-extrabold text-gray-700">{m.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* OpEx Expense Category Share Progress Bars */}
              {reportData.expenseCategoryBreakdown && reportData.expenseCategoryBreakdown.length > 0 && (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-black text-gray-900 text-sm">Distribusi Biaya Operasional (OpEx)</h3>
                      <p className="text-xs text-gray-500">Breakdown pengeluaran berdasarkan kategori biaya</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500">Keseluruhan Pengeluaran:</span>
                      <span className="text-xs font-mono font-black text-rose-600">
                        {formatIDR(reportData.summary?.totalExpenses)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {reportData.expenseCategoryBreakdown.map((item: any) => (
                      <div key={item.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-800">
                            {CATEGORY_NAMES[item.category] || item.category}
                          </span>
                          <span className="font-mono font-bold text-gray-900">
                            {formatIDR(item.totalAmount)} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-slate-800"
                            style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Financial Breakdown Table */}
              <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-gray-900 text-sm">Performa Keuangan Per Properti</h3>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Ditampilkan untuk periode terfilter: {startDate ? formatDate(startDate) : "Awal"} s/d {endDate ? formatDate(endDate) : "Sekarang"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 font-bold">{reportData.propertyBreakdown?.length || 0} Properti</span>
                </div>

                {reportData.summary?.grossRevenue === 0 && (
                  <div className="p-4 bg-amber-50/80 border-b border-amber-100 text-amber-800 text-xs flex items-start gap-2.5">
                    <IconAlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>
                      <strong>Informasi Data:</strong> Tidak ada transaksi invoice <strong>LUNAS</strong> pada periode tanggal ini ({formatDate(startDate)} - {formatDate(endDate)}). Invoice tagihan sewa bulan ini yang belum terbayar tercatat pada kartu <strong>Piutang Belum Terbayar ({formatIDR(reportData.summary?.pendingRevenue)})</strong>. Pilih periode <strong>&quot;Semua Periode Data&quot;</strong> pada filter di atas untuk melihat akumulasi pendapatan historis.
                    </span>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-bold">
                      <tr>
                        <th className="px-5 py-4">Nama Properti</th>
                        <th className="px-5 py-4 text-right">Gross Pendapatan</th>
                        <th className="px-5 py-4 text-right">Kontribusi (%)</th>
                        <th className="px-5 py-4 text-right">Pengeluaran OpEx</th>
                        <th className="px-5 py-4 text-right">Laba Bersih (IDR)</th>
                        <th className="px-5 py-4 text-right">Profit Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {reportData.propertyBreakdown?.map((prop: any) => (
                        <tr key={prop.propertyId} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4 font-bold text-gray-900">{prop.propertyName}</td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-emerald-700">
                            {formatIDR(prop.grossIncome)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-gray-600">{prop.revenueShare}%</td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-rose-600">
                            {formatIDR(prop.expensesAmount)}
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-black text-gray-900 text-sm">
                            {formatIDR(prop.netIncome)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 text-[11px] font-black">
                              {prop.profitMargin}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: LAPORAN OKUPANSI */}
          {/* ================================================================= */}
          {activeTab === "occupancy" && (
            <div className="space-y-6">
              {/* Occupancy KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    Tingkat Hunian (Occupancy)
                  </span>
                  <p className="text-2xl font-black text-blue-900">
                    {(Number(reportData.summary?.occupancyRate) || 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-blue-700/80 font-medium">Persentase Unit Terisi</p>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Pendapatan Sewa Bulanan Riil
                  </span>
                  <p className="text-2xl font-black text-emerald-900">{formatIDR(reportData.summary?.realizedMonthlyRent)}</p>
                  <p className="text-xs text-emerald-700/80 font-medium">
                    {reportData.summary?.occupiedUnits} dari {reportData.summary?.totalUnits} Unit Terisi
                  </p>
                </div>

                <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                    Potensi Maksimal (100% Full)
                  </span>
                  <p className="text-2xl font-black text-purple-900">{formatIDR(reportData.summary?.maxPotentialMonthlyRent)}</p>
                  <p className="text-xs text-purple-700/80 font-medium">Jika Seluruh Kamar Terisi</p>
                </div>

                <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    Kerugian Potensial (Vacancy Loss)
                  </span>
                  <p className="text-2xl font-black text-amber-900">{formatIDR(reportData.summary?.vacancyLoss)}</p>
                  <p className="text-xs text-amber-700/80 font-medium">
                    {reportData.summary?.availableUnits} Kamar Kosong Siap Huni
                  </p>
                </div>
              </div>

              {/* Occupancy per Property Breakdown Table */}
              <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-black text-gray-900 text-sm">Statistik Okupansi Per Properti</h3>
                  <span className="text-xs text-gray-500 font-bold">{reportData.propertyBreakdown?.length || 0} Properti</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-bold">
                      <tr>
                        <th className="px-5 py-4">Nama Properti</th>
                        <th className="px-5 py-4 text-center">Total Unit</th>
                        <th className="px-5 py-4 text-center">Terisi</th>
                        <th className="px-5 py-4 text-center">Kosong</th>
                        <th className="px-5 py-4 text-center">Perawatan</th>
                        <th className="px-5 py-4 text-right">Tingkat Okupansi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {reportData.propertyBreakdown?.map((prop: any) => (
                        <tr key={prop.propertyId} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4 font-bold text-gray-900">{prop.propertyName}</td>
                          <td className="px-5 py-4 text-center font-bold">{prop.totalUnits}</td>
                          <td className="px-5 py-4 text-center font-bold text-emerald-700">{prop.occupiedUnits}</td>
                          <td className="px-5 py-4 text-center text-gray-500">{prop.availableUnits}</td>
                          <td className="px-5 py-4 text-center text-amber-600">{prop.maintenanceUnits}</td>
                          <td className="px-5 py-4 text-right font-black text-blue-700 text-sm">
                            {(Number(prop.occupancyRate) || 0).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: LAPORAN PENYEWA */}
          {/* ================================================================= */}
          {activeTab === "tenant" && (
            <div className="space-y-6">
              {/* Tenant KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                    Kontrak Aktif
                  </span>
                  <p className="text-2xl font-black text-purple-900">{reportData.summary?.activeLeasesCount} Kontrak</p>
                  <p className="text-xs text-purple-700/80 font-medium">Kontrak Sewa Berjalan</p>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Total Profil Penyewa
                  </span>
                  <p className="text-2xl font-black text-gray-900">{reportData.summary?.totalTenantsCount} Orang</p>
                  <p className="text-xs text-gray-500 font-medium">Terdaftar di sistem</p>
                </div>

                <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    Berakhir &lt; 30 Hari
                  </span>
                  <p className="text-2xl font-black text-amber-900">{reportData.summary?.leasesExpiring30Days} Kontrak</p>
                  <p className="text-xs text-amber-700/80 font-medium">Perlu konfirmasi perpanjangan</p>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Total Security Deposit
                  </span>
                  <p className="text-2xl font-black text-emerald-900">{formatIDR(reportData.summary?.totalSecurityDeposit)}</p>
                  <p className="text-xs text-emerald-700/80 font-medium">Tersimpan dari kontrak aktif</p>
                </div>
              </div>

              {/* Lease List Table */}
              <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-black text-gray-900 text-sm">Daftar Kontrak & Penyewa</h3>
                  <span className="text-xs text-gray-500 font-bold">{reportData.leases?.length || 0} Kontrak</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-bold">
                      <tr>
                        <th className="px-5 py-4">Nama Penyewa</th>
                        <th className="px-5 py-4">Properti & Unit</th>
                        <th className="px-5 py-4 text-right">Harga Sewa</th>
                        <th className="px-5 py-4">Periode Kontrak</th>
                        <th className="px-5 py-4 text-right">Security Deposit</th>
                        <th className="px-5 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {reportData.leases?.map((l: any) => (
                        <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-gray-900">{l.tenant?.fullName || "-"}</div>
                            <div className="text-[11px] text-gray-400">{l.tenant?.phoneNumber || "-"}</div>
                          </td>
                          <td className="px-5 py-4 font-medium">
                            <div>{l.unit?.property?.name || "-"}</div>
                            <div className="text-[11px] font-bold text-emerald-700">Unit {l.unit?.unitNumber}</div>
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-gray-900">
                            {formatIDR(l.rentPrice)}
                          </td>
                          <td className="px-5 py-4 text-gray-600 font-medium">
                            {formatDate(l.startDate)} - {formatDate(l.endDate)}
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-gray-700">
                            {formatIDR(l.securityDeposit)}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                              l.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: LAPORAN OPERASIONAL */}
          {/* ================================================================= */}
          {activeTab === "operational" && (
            <div className="space-y-6">
              {/* Operational KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    Total Tiket Maintenance
                  </span>
                  <p className="text-2xl font-black text-amber-900">{reportData.summary?.totalTickets} Tiket</p>
                  <p className="text-xs text-amber-700/80 font-medium">Tercatat di sistem</p>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Tingkat Penyelesaian
                  </span>
                  <p className="text-2xl font-black text-emerald-900">
                    {(Number(reportData.summary?.resolutionRate) || 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-emerald-700/80 font-medium">{reportData.summary?.resolvedCount} Tiket Selesai</p>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    Dalam Pengerjaan
                  </span>
                  <p className="text-2xl font-black text-blue-900">{reportData.summary?.inProgressCount} Tiket</p>
                  <p className="text-xs text-blue-700/80 font-medium">Sedang diproses staff</p>
                </div>

                <div className="rounded-3xl border border-rose-100 bg-rose-50/40 p-5 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                    Total Biaya Perbaikan
                  </span>
                  <p className="text-2xl font-black text-rose-900">{formatIDR(reportData.summary?.totalActualCost)}</p>
                  <p className="text-xs text-rose-700/80 font-medium">Pengeluaran aktual maintenance</p>
                </div>
              </div>

              {/* Maintenance Tickets Breakdown Table */}
              <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-black text-gray-900 text-sm">Daftar Tiket & Laporan Operasional</h3>
                  <span className="text-xs text-gray-500 font-bold">{reportData.tickets?.length || 0} Tiket</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-bold">
                      <tr>
                        <th className="px-5 py-4">No. Tiket & Judul</th>
                        <th className="px-5 py-4">Properti & Unit</th>
                        <th className="px-5 py-4">Prioritas</th>
                        <th className="px-5 py-4 text-right">Biaya Aktual</th>
                        <th className="px-5 py-4 text-center">Status</th>
                        <th className="px-5 py-4">Tanggal Lapor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {reportData.tickets?.map((t: any) => (
                        <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-mono font-extrabold text-gray-900">#{t.ticketNumber}</div>
                            <div className="font-bold text-gray-800 text-xs mt-0.5">{t.title}</div>
                          </td>
                          <td className="px-5 py-4 font-medium">
                            <div>{t.property?.name || "-"}</div>
                            {t.unit && <div className="text-[11px] text-emerald-700">Unit {t.unit.unitNumber}</div>}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${
                              t.priority === "HIGH" || t.priority === "URGENT"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-gray-900">
                            {t.actualCost ? formatIDR(t.actualCost) : "-"}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                              t.status === "RESOLVED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : t.status === "IN_PROGRESS"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-600 font-medium whitespace-nowrap">
                            {formatDate(t.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

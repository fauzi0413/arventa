"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  Search,
  Filter,
  Building,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Sparkles,
  Calendar,
  CreditCard,
  MessageSquare,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import HousekeepingInvoiceDetailModal, {
  HousekeepingInvoiceItem,
} from "./_components/HousekeepingInvoiceDetailModal";

interface PropertyOption {
  id: string;
  name: string;
}

interface StatsData {
  totalAmount: number;
  totalCount: number;
  paidAmount: number;
  paidCount: number;
  pendingAmount: number;
  pendingCount: number;
  overdueAmount: number;
  overdueCount: number;
}

export default function HousekeepingUnitExpensesPage() {
  const [invoices, setInvoices] = useState<HousekeepingInvoiceItem[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalAmount: 0,
    totalCount: 0,
    paidAmount: 0,
    paidCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
    overdueAmount: 0,
    overdueCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-polling state (Realtime updates)
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters State
  const [selectedPropertyId, setSelectedPropertyId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<HousekeepingInvoiceItem | null>(null);

  // Fetch properties assigned to logged-in Housekeeping staff
  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties?limit=100");
      const json = await res.json();
      if (res.ok && json.success) {
        setProperties(json.data.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (err) {
      console.error("Gagal memuat properti tugas housekeeping:", err);
    }
  }, []);

  // Fetch unit invoices strictly scoped to housekeeping staff properties
  const fetchInvoices = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        if (selectedPropertyId !== "ALL") params.append("propertyId", selectedPropertyId);
        if (selectedStatus !== "ALL") params.append("status", selectedStatus);
        if (searchQuery.trim()) params.append("search", searchQuery.trim());
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const res = await fetch(`/api/finance/invoices?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal memuat data tagihan unit.");
        }

        setInvoices(json.data || []);
        if (json.meta) setMeta(json.meta);
        if (json.meta?.stats) setStats(json.meta.stats);
        else if (json.stats) setStats(json.stats);

        setLastUpdated(new Date());
      } catch (err: any) {
        console.error("Error fetching housekeeping invoices:", err);
        setError(err.message || "Terjadi kesalahan sistem saat memuat data penagihan.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, selectedPropertyId, selectedStatus, searchQuery, startDate, endDate]
  );

  // Initial Load
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Real-time background polling interval (every 30 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchInvoices(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchInvoices]);

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

  // Calculate Overdue Days
  const getOverdueDays = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> LUNAS
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-extrabold text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3 w-3" /> MENUNGGAK
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-extrabold text-gray-600 border border-gray-200">
            DIBATALKAN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> PENDING
          </span>
        );
    }
  };

  // Filter overdue items for Monitoring Tunggakan banner
  const overdueInvoices = invoices.filter((inv) => inv.status === "OVERDUE");

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* --------------------------------------------------------------------- */}
      {/* PAGE HEADER & HERO BANNER */}
      {/* --------------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#242823] via-[#383E36] to-[#1C201C] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-[#8FA28A]/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#8FA28A]/20 px-3.5 py-1 text-xs font-bold text-[#8FA28A] border border-[#8FA28A]/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ARV-HK-05 • Keuangan & Penagihan Unit Lapangan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Keuangan & Penagihan Unit
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Monitoring tagihan invoice unit kamar, status pembayaran realtime, riwayat transaksi, dan penanganan tunggakan penghuni yang menjadi tanggung jawab tugas Anda.
            </p>
          </div>

          {/* Manual Refresh Control */}
          <div className="flex items-center gap-3">
            {/* Manual Refresh Button */}
            <button
              suppressHydrationWarning
              onClick={() => fetchInvoices(true)}
              disabled={Boolean(refreshing || loading)}
              className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white border border-white/15 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Memperbarui..." : "Segarkan Data"}</span>
            </button>
          </div>
        </div>

        {/* Realtime Last Updated Indicator */}
        {lastUpdated && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
            <span className="text-[#8FA28A] font-medium">Hanya Properti Tugas Anda</span>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* KPI METRIC STATS CARDS */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tagihan Unit */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Total Tagihan Unit
            </span>
            <div className="p-2.5 rounded-2xl bg-gray-100 text-gray-700">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{formatIDR(stats.totalAmount)}</p>
            <p className="text-xs text-gray-500 font-medium">{stats.totalCount} total invoice diterbitkan</p>
          </div>
        </div>

        {/* Menunggu Pembayaran (Pending) */}
        <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Menunggu (Pending)
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-800">{formatIDR(stats.pendingAmount)}</p>
            <p className="text-xs text-amber-700/80 font-medium">{stats.pendingCount} unit belum bayar</p>
          </div>
        </div>

        {/* Pembayaran Lunas (Paid) */}
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Pembayaran Lunas
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-800">{formatIDR(stats.paidAmount)}</p>
            <p className="text-xs text-emerald-700/80 font-medium">{stats.paidCount} invoice lunas</p>
          </div>
        </div>

        {/* Monitoring Tunggakan (Overdue) */}
        <div
          className={`rounded-3xl border p-5 shadow-xs flex flex-col justify-between space-y-2 transition-all ${stats.overdueCount > 0
            ? "border-rose-200 bg-rose-50/60 ring-2 ring-rose-500/20"
            : "border-gray-100 bg-white"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Monitoring Tunggakan
            </span>
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-800">{formatIDR(stats.overdueAmount)}</p>
            <p className="text-xs text-rose-700/90 font-black">
              {stats.overdueCount} unit lewat jatuh tempo
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* MONITORING TUNGGAKAN HIGHLIGHT DRAWER / BANNER */}
      {/* --------------------------------------------------------------------- */}
      {stats.overdueCount > 0 && (
        <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-500/10 via-rose-50/50 to-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2.5 text-rose-800">
              <div className="p-2 rounded-xl bg-rose-600 text-white">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">
                  Perhatian: Monitoring Tunggakan Unit Lapangan ({stats.overdueCount} Tagihan)
                </h3>
                <p className="text-xs text-rose-700">
                  Total tunggakan menunggak senilai{" "}
                  <strong className="font-extrabold">{formatIDR(stats.overdueAmount)}</strong>.
                  Follow-up penghuni unit untuk memastikan kelancaran operasional properti.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedStatus("OVERDUE");
                setPage(1);
              }}
              className="self-start sm:self-auto rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 shadow-sm transition-all cursor-pointer"
            >
              Filter Khusus Tunggakan
            </button>
          </div>

          {/* Quick list of top overdue units */}
          {overdueInvoices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {overdueInvoices.slice(0, 3).map((inv) => {
                const daysLate = getOverdueDays(inv.dueDate);
                const tenantName =
                  inv.lease?.tenant?.fullName || inv.lease?.tenant?.user?.fullName || "Penghuni";
                const unitNum = inv.lease?.unit?.unitNumber || "-";
                const propName = inv.lease?.unit?.property?.name || "Properti";

                return (
                  <div
                    key={inv.id}
                    className="rounded-2xl border border-rose-200/80 bg-white p-3.5 shadow-2xs space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-gray-900">Unit {unitNum}</span>
                        <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-black">
                          {daysLate} Hari Terlambat
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-800 line-clamp-1 mt-1">{tenantName}</p>
                      <p className="text-[11px] text-gray-500">{propName}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="font-black text-rose-700 font-mono">
                        {formatIDR(inv.totalAmount)}
                      </span>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="text-[11px] font-bold text-[#6B7F66] hover:underline"
                      >
                        Lihat Detail & WA
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SEARCH, PROPERTY & DATE FILTERS TOOLBAR */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari No Invoice / Penghuni / Unit..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2.5 text-xs font-semibold focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Assigned Property Dropdown */}
          <div className="relative">
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setLoading(true);
                setSelectedPropertyId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all cursor-pointer"
            >
              <option value="ALL">Semua Properti Tugas ({properties.length})</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setLoading(true);
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setLoading(true);
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          <span className="text-xs text-gray-500 font-bold mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-[#8FA28A]" /> Status Pembayaran:
          </span>
          {[
            { key: "ALL", label: "Semua Status" },
            { key: "PENDING", label: "Pending (Menunggu)" },
            { key: "PAID", label: "Paid (Lunas)" },
            { key: "OVERDUE", label: "Overdue (Menunggak)" },
            { key: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (selectedStatus !== tab.key) {
                  setLoading(true);
                  setSelectedStatus(tab.key);
                  setPage(1);
                }
              }}
              className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${selectedStatus === tab.key
                ? "bg-[#6B7F66] text-white shadow-xs"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
            >
              {tab.label}
            </button>
          ))}

          {(startDate || endDate || selectedPropertyId !== "ALL" || selectedStatus !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setLoading(true);
                setSelectedPropertyId("ALL");
                setSelectedStatus("ALL");
                setSearchQuery("");
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
              className="ml-auto text-xs font-bold text-gray-500 hover:text-gray-900 underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* INVOICE DATA TABLE / CARD LIST */}
      {/* --------------------------------------------------------------------- */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-[#8FA28A]" />
            <p className="text-xs font-semibold">Memuat data invoice penagihan unit...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Receipt className="h-7 w-7" />
            </div>
            <p className="font-bold text-base text-gray-800">Tidak ada tagihan unit ditemukan</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Tidak ditemukan data invoice yang sesuai dengan kriteria filter atau tugas properti Anda saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-5 py-4">No. Invoice</th>
                  <th className="px-5 py-4">Penghuni & Unit</th>
                  <th className="px-5 py-4">Properti Tugas</th>
                  <th className="px-5 py-4">Rincian Biaya</th>
                  <th className="px-5 py-4 text-right">Total Tagihan</th>
                  <th className="px-5 py-4">Jatuh Tempo</th>
                  <th className="px-5 py-4">Status Pembayaran</th>
                  <th className="px-5 py-4 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {invoices.map((inv) => {
                  const propertyName = inv.lease?.unit?.property?.name || "-";
                  const unitNumber = inv.lease?.unit?.unitNumber || "-";
                  const tenantName =
                    inv.lease?.tenant?.fullName ||
                    inv.lease?.tenant?.user?.fullName ||
                    "Penghuni Kamar";

                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4 font-mono font-extrabold text-gray-900 whitespace-nowrap">
                        #{inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">{tenantName}</div>
                        <div className="text-[11px] font-black text-[#6B7F66] font-mono">
                          Unit {unitNumber}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600 font-medium whitespace-nowrap">
                        {propertyName}
                      </td>
                      <td className="px-5 py-4 text-[11px] text-gray-500 space-y-0.5 font-medium">
                        <div>Sewa: {formatIDR(inv.amount)}</div>
                        {Number(inv.utilityAmount) > 0 && (
                          <div>Util: {formatIDR(inv.utilityAmount)}</div>
                        )}
                        {Number(inv.penaltyAmount) > 0 && (
                          <div className="text-rose-600 font-bold">
                            Denda: {formatIDR(inv.penaltyAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-black text-gray-900 text-right whitespace-nowrap font-mono text-sm">
                        {formatIDR(inv.totalAmount)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-600">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderStatusBadge(inv.status)}
                      </td>
                      <td className="px-5 py-4 text-left whitespace-nowrap">
                        <button
                          title="Lihat Detail Rincian & Bukti Transfer"
                          onClick={() => setSelectedInvoice(inv)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-gray-500" />
                          <span>Rincian</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && invoices.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 px-5 py-4 bg-gray-50/60 text-xs text-gray-600 gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Menampilkan <strong className="text-gray-900">{meta.totalCount > 0 ? (page - 1) * limit + 1 : 0}</strong> - <strong className="text-gray-900">{Math.min(page * limit, meta.totalCount || invoices.length)}</strong> dari <strong className="text-gray-900">{meta.totalCount || invoices.length}</strong> tagihan unit
              </span>

              {/* Items per page selector */}
              <div className="flex items-center gap-1.5 text-gray-500">
                <span className="text-[11px]">Per halaman:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLoading(true);
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-700 focus:border-[#8FA28A] focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => {
                  if (page > 1) {
                    setLoading(true);
                    setPage((p) => Math.max(1, p - 1));
                  }
                }}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 shadow-2xs transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Sebelumnya</span>
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: meta.totalPages || 1 }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.min(meta.totalPages || 1, page + 2))
                .map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => {
                      if (pageNum !== page) {
                        setLoading(true);
                        setPage(pageNum);
                      }
                    }}
                    className={`h-8 w-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      pageNum === page
                        ? "bg-[#6B7F66] text-white shadow-2xs"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

              <button
                disabled={page >= (meta.totalPages || 1)}
                onClick={() => {
                  if (page < (meta.totalPages || 1)) {
                    setLoading(true);
                    setPage((p) => p + 1);
                  }
                }}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 shadow-2xs transition-all cursor-pointer"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* INVOICE DETAIL MODAL */}
      {/* --------------------------------------------------------------------- */}
      <HousekeepingInvoiceDetailModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />
    </div>
  );
}

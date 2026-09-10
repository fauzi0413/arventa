"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  IconReceipt,
  IconPlus,
  IconSearch,
  IconFilter,
  IconBuilding,
  IconCalendar,
  IconChecklist,
  IconEye,
  IconEdit,
  IconTrash,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconLoader2,
  IconRefresh,
  IconCoin,
  IconChevronLeft,
  IconChevronRight,
  IconSparkles,
} from "@tabler/icons-react";

import { CreateInvoiceModal } from "./create-invoice-modal";
import { EditInvoiceModal } from "./edit-invoice-modal";
import { DetailInvoiceModal } from "./detail-invoice-modal";
import { UpdateStatusModal } from "./update-status-modal";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface PropertyOption {
  id: string;
  name: string;
}

interface ActiveLeaseOption {
  leaseId: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  rentPrice: number;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  amount: number | string;
  utilityAmount: number | string;
  penaltyAmount: number | string;
  totalAmount: number | string;
  dueDate: string;
  createdAt: string;
  paidAt?: string | null;
  status: string;
  paymentReceipt?: string | null;
  lease?: {
    rentalPeriod?: string;
    unit?: {
      unitNumber?: string;
      floor?: number;
      property?: {
        id?: string;
        name?: string;
        address?: string;
      };
    };
    tenant?: {
      fullName?: string;
      phoneNumber?: string;
      email?: string;
      user?: {
        fullName?: string;
        phoneNumber?: string;
        email?: string;
      };
    };
  };
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

export function InvoiceManagementView() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [activeLeases, setActiveLeases] = useState<ActiveLeaseOption[]>([]);
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

  // Filters State
  const [selectedPropertyId, setSelectedPropertyId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals visibility state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [runningCron, setRunningCron] = useState(false);

  const handleRunAutoBilling = async () => {
    setRunningCron(true);
    try {
      const res = await fetch("/api/cron/billing", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Gagal menjalankan auto billing.");
      }
      const data = json.data;
      alert(
        `Auto Billing Selesai!\n\n` +
          `• Overdue diperbarui: ${data.overdueUpdatedCount || 0}\n` +
          `• Invoice H-7 dibuat: ${data.invoicesGeneratedCount || 0}\n` +
          `• Email Reminder terkirim: ${data.remindersSentCount || 0}`
      );
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || "Gagal menjalankan auto billing.");
    } finally {
      setRunningCron(false);
    }
  };

  // Fetch properties list for filter
  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties?limit=100");
      const json = await res.json();
      if (res.ok && json.success) {
        setProperties(
          json.data.map((p: any) => ({ id: p.id, name: p.name }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch properties for invoice filter:", err);
    }
  }, []);

  // Fetch active leases for dropdown create modal
  const fetchActiveLeases = useCallback(async () => {
    try {
      const res = await fetch("/api/finance/invoices?leasesOnly=true");
      const json = await res.json();
      if (res.ok && json.success) {
        setActiveLeases(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch active leases for invoice:", err);
    }
  }, []);

  // Fetch invoices list with stats
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");

      if (selectedPropertyId !== "ALL") params.append("propertyId", selectedPropertyId);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/finance/invoices?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memuat data invoice.");
      }

      setInvoices(json.data || []);
      if (json.meta) setMeta(json.meta);
      if (json.meta?.stats) setStats(json.meta.stats);
      else if (json.stats) setStats(json.stats);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem saat memuat invoice.");
    } finally {
      setLoading(false);
    }
  }, [page, selectedPropertyId, selectedStatus, searchQuery, startDate, endDate]);

  useEffect(() => {
    fetchProperties();
    fetchActiveLeases();
  }, [fetchProperties, fetchActiveLeases]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/finance/invoices/${selectedInvoice.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus invoice.");
      }
      setIsDeleteOpen(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus invoice.");
    } finally {
      setDeleting(false);
    }
  };

  const formatIDR = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
            <IconCheck className="h-3 w-3" /> PAID (LUNAS)
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">
            <IconAlertTriangle className="h-3 w-3" /> OVERDUE
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
            <IconClock className="h-3 w-3" /> PENDING
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <IconReceipt className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Keuangan & Penagihan Invoice
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola tagihan sewa unit properti, ubah status pembayaran, dan terbitkan kuitansi digital.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              fetchActiveLeases();
              fetchInvoices();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2.5 shadow-sm transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Refresh Data"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={handleRunAutoBilling}
            disabled={runningCron}
            className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-3.5 py-2.5 shadow-sm transition-all dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/60 disabled:opacity-50"
            title="Jalankan Otomatisasi Tagihan H-7, Overdue & Email Reminder"
          >
            <IconSparkles className={`h-4 w-4 ${runningCron ? "animate-spin" : ""}`} />
            {runningCron ? "Memproses..." : "Auto Billing (H-7)"}
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all"
          >
            <IconPlus className="h-4 w-4" /> Buat Invoice Baru
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penagihan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Akumulasi Tagihan</span>
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <IconCoin className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{formatIDR(stats.totalAmount)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{stats.totalCount} total transaksi invoice</p>
        </div>

        {/* Total Menunggu (Pending) */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-2 shadow-sm dark:bg-amber-950/20 dark:border-amber-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Menunggu (Pending)</span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 border border-amber-200 dark:bg-amber-900/60 dark:text-amber-300">
              <IconClock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{formatIDR(stats.pendingAmount)}</p>
          <p className="text-[11px] text-amber-600/90 dark:text-amber-400/80">{stats.pendingCount} tagihan belum dibayar</p>
        </div>

        {/* Total Lunas (Paid) */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-2 shadow-sm dark:bg-emerald-950/20 dark:border-emerald-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Pembayaran Lunas</span>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300">
              <IconCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatIDR(stats.paidAmount)}</p>
          <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/80">{stats.paidCount} invoice berhasil lunas</p>
        </div>

        {/* Total Menunggak (Overdue) */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 space-y-2 shadow-sm dark:bg-rose-950/20 dark:border-rose-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Menunggak (Overdue)</span>
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700 border border-rose-200 dark:bg-rose-900/60 dark:text-rose-300">
              <IconAlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{formatIDR(stats.overdueAmount)}</p>
          <p className="text-[11px] text-rose-600/90 dark:text-rose-400/80">{stats.overdueCount} tagihan lewati jatuh tempo</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <IconSearch className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Invoice / Penyewa / Unit..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs pl-9 pr-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800/80 dark:border-slate-700 dark:text-white dark:focus:bg-slate-900"
            />
          </div>

          {/* Property Dropdown Filter */}
          <div className="relative">
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800/80 dark:border-slate-700 dark:text-white dark:focus:bg-slate-900"
            >
              <option value="ALL">Semua Properti</option>
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
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800/80 dark:border-slate-700 dark:text-white dark:focus:bg-slate-900"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all dark:bg-slate-800/80 dark:border-slate-700 dark:text-white dark:focus:bg-slate-900"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <IconFilter className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Filter Status:
          </span>
          {[
            { key: "ALL", label: "Semua Status" },
            { key: "PENDING", label: "Pending" },
            { key: "PAID", label: "Paid (Lunas)" },
            { key: "OVERDUE", label: "Overdue (Menunggak)" },
            { key: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedStatus(tab.key);
                setPage(1);
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs transition-all ${
                selectedStatus === tab.key
                  ? "bg-emerald-600 text-white font-bold shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {(startDate || endDate || selectedPropertyId !== "ALL" || selectedStatus !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedPropertyId("ALL");
                setSelectedStatus("ALL");
                setSearchQuery("");
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
              className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
            <IconLoader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-xs font-medium">Memuat data invoice penagihan...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 font-medium">
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <IconReceipt className="h-6 w-6" />
            </div>
            <p className="font-bold text-base text-slate-900 dark:text-white">Belum ada data invoice</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Tidak ditemukan invoice yang sesuai dengan kriteria filter saat ini. Klik tombol &quot;Buat Invoice Baru&quot; untuk membuat tagihan sewa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-4 py-3.5">No. Invoice</th>
                  <th className="px-4 py-3.5">Penyewa & Unit</th>
                  <th className="px-4 py-3.5">Properti</th>
                  <th className="px-4 py-3.5">Rincian Biaya</th>
                  <th className="px-4 py-3.5 text-right">Total Tagihan</th>
                  <th className="px-4 py-3.5">Jatuh Tempo</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {invoices.map((inv) => {
                  const propertyName = inv.lease?.unit?.property?.name || "-";
                  const unitNumber = inv.lease?.unit?.unitNumber || "-";
                  const tenantName =
                    inv.lease?.tenant?.fullName ||
                    inv.lease?.tenant?.user?.fullName ||
                    "Penyewa";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        #{inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{tenantName}</div>
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Unit {unitNumber}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">
                        {propertyName}
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 font-medium">
                        <div>Sewa: {formatIDR(inv.amount)}</div>
                        {Number(inv.utilityAmount) > 0 && <div>Util: {formatIDR(inv.utilityAmount)}</div>}
                        {Number(inv.penaltyAmount) > 0 && <div className="text-rose-600 font-bold">Denda: {formatIDR(inv.penaltyAmount)}</div>}
                      </td>
                      <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white text-right whitespace-nowrap text-sm">
                        {formatIDR(inv.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                        {new Date(inv.dueDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Detail Button */}
                          <button
                            title="Lihat Detail & Kuitansi"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsDetailOpen(true);
                            }}
                            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <IconEye className="h-4 w-4" />
                          </button>

                          {/* Quick Status Button */}
                          <button
                            title="Ubah Status Invoice"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsStatusOpen(true);
                            }}
                            className="rounded-xl p-2 text-amber-600 hover:bg-amber-50 transition-colors dark:text-amber-400 dark:hover:bg-amber-950/40"
                          >
                            <IconChecklist className="h-4 w-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            title="Edit Rincian Invoice"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsEditOpen(true);
                            }}
                            className="rounded-xl p-2 text-blue-600 hover:bg-blue-50 transition-colors dark:text-blue-400 dark:hover:bg-blue-950/40"
                          >
                            <IconEdit className="h-4 w-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            title="Hapus Invoice"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsDeleteOpen(true);
                            }}
                            className="rounded-xl p-2 text-rose-600 hover:bg-rose-50 transition-colors dark:text-rose-400 dark:hover:bg-rose-950/40"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>
              Halaman {meta.page} dari {meta.totalPages} ({meta.totalCount} total invoice)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!meta.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              >
                <IconChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              >
                Next <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals Integration */}
      <CreateInvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchActiveLeases();
          fetchInvoices();
        }}
        activeLeases={activeLeases}
      />

      <EditInvoiceModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedInvoice(null);
        }}
        onSuccess={fetchInvoices}
        invoice={selectedInvoice}
      />

      <DetailInvoiceModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      <UpdateStatusModal
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setSelectedInvoice(null);
        }}
        onSuccess={fetchInvoices}
        invoice={selectedInvoice}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedInvoice(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Invoice Tagihan?"
        description={
          <span>
            Apakah Anda yakin ingin menghapus invoice{" "}
            <strong className="text-slate-900 dark:text-white">#{selectedInvoice?.invoiceNumber}</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        confirmText="Ya, Hapus Invoice"
        cancelText="Batal"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  IconTools,
  IconPlus,
  IconSearch,
  IconFilter,
  IconBuilding,
  IconCalendar,
  IconReceipt,
  IconEye,
  IconEdit,
  IconTrash,
  IconCheck,
  IconLoader2,
  IconRefresh,
  IconCoin,
  IconChevronLeft,
  IconChevronRight,
  IconSparkles,
  IconFileText,
  IconTag,
  IconTrendingUp,
  IconCategory,
  IconUpload,
  IconX,
  IconPaperclip,
} from "@tabler/icons-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface PropertyOption {
  id: string;
  name: string;
}

interface UnitOption {
  id: string;
  unitNumber: string;
  propertyId: string;
}

interface ExpenseItem {
  id: string;
  propertyId: string;
  unitId?: string | null;
  createdById: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  property?: {
    id: string;
    name: string;
    address?: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
    floor?: number;
  } | null;
  createdBy?: {
    id: string;
    fullName?: string;
    email?: string;
    role?: string;
  };
}

interface CategoryBreakdown {
  category: string;
  totalAmount: number;
  count: number;
}

interface StatsData {
  totalAmount: number;
  totalCount: number;
  monthAmount: number;
  monthCount: number;
  categoryBreakdown: CategoryBreakdown[];
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; badge: string }> = {
  MAINTENANCE: { label: "Perbaikan & Perawatan", color: "text-amber-700 bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-800" },
  UTILITY: { label: "Utilitas (Listrik & Air)", color: "text-blue-700 bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-800" },
  HOUSEKEEPING_SALARY: { label: "Gaji & Insentif Staf", color: "text-purple-700 bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-800" },
  SUPPLIES: { label: "Perlengkapan & Kebersihan", color: "text-emerald-700 bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-800" },
  TAX_PBB: { label: "Pajak & PBB", color: "text-rose-700 bg-rose-50 border-rose-200", badge: "bg-rose-100 text-rose-800" },
  OTHER: { label: "Lain-lain", color: "text-gray-700 bg-gray-50 border-gray-200", badge: "bg-gray-100 text-gray-800" },
};

export function ExpenseManagementView() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalAmount: 0,
    totalCount: 0,
    monthAmount: 0,
    monthCount: 0,
    categoryBreakdown: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-polling state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters State
  const [selectedPropertyId, setSelectedPropertyId] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
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

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [detailExpense, setDetailExpense] = useState<ExpenseItem | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("MAINTENANCE");
  const [formAmount, setFormAmount] = useState("");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formUnitId, setFormUnitId] = useState("");
  const [formExpenseDate, setFormExpenseDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formReceiptUrl, setFormReceiptUrl] = useState("");

  // Fetch properties assigned to or owned by logged-in user
  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties?limit=100");
      const json = await res.json();
      if (res.ok && json.success) {
        setProperties(json.data.map((p: any) => ({ id: p.id, name: p.name })));
        if (json.data.length > 0 && !formPropertyId) {
          setFormPropertyId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Gagal memuat daftar properti:", err);
    }
  }, [formPropertyId]);

  // Fetch units based on selected form property
  const fetchUnitsForProperty = useCallback(async (propId: string) => {
    if (!propId) {
      setUnits([]);
      return;
    }
    try {
      const res = await fetch(`/api/units?propertyId=${propId}&limit=100`);
      const json = await res.json();
      if (res.ok && json.success) {
        setUnits(json.data.map((u: any) => ({ id: u.id, unitNumber: u.unitNumber, propertyId: u.propertyId })));
      }
    } catch (err) {
      console.error("Gagal memuat daftar unit:", err);
    }
  }, []);

  // Fetch expenses with active filters
  const fetchExpenses = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        if (selectedPropertyId !== "ALL") params.append("propertyId", selectedPropertyId);
        if (selectedCategory !== "ALL") params.append("category", selectedCategory);
        if (searchQuery.trim()) params.append("search", searchQuery.trim());
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const res = await fetch(`/api/finance/expenses?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal memuat data pengeluaran operasional.");
        }

        setExpenses(json.data || []);
        if (json.meta) {
          setMeta(json.meta);
          if (json.meta.stats) setStats(json.meta.stats);
        }
        setLastUpdated(new Date());
      } catch (err: any) {
        console.error("Error fetching expenses:", err);
        setError(err.message || "Terjadi kesalahan sistem saat memuat pengeluaran.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, selectedPropertyId, selectedCategory, searchQuery, startDate, endDate]
  );

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Dynamic unit load on property change in form
  useEffect(() => {
    if (formPropertyId) {
      fetchUnitsForProperty(formPropertyId);
    }
  }, [formPropertyId, fetchUnitsForProperty]);

  // Real-time background polling interval (every 30 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchExpenses(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchExpenses]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setFormTitle("");
    setFormCategory("MAINTENANCE");
    setFormAmount("");
    setFormPropertyId(properties[0]?.id || "");
    setFormUnitId("");
    setFormExpenseDate(new Date().toISOString().split("T")[0]);
    setFormNotes("");
    setFormReceiptUrl("");
    setIsFormModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setFormTitle(exp.title);
    setFormCategory(exp.category);
    setFormAmount(exp.amount.toString());
    setFormPropertyId(exp.propertyId);
    setFormUnitId(exp.unitId || "");
    setFormExpenseDate(new Date(exp.expenseDate).toISOString().split("T")[0]);
    setFormNotes(exp.notes || "");
    setFormReceiptUrl(exp.receiptUrl || "");
    setIsFormModalOpen(true);
  };

  // Submit Create / Edit form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAmount || !formPropertyId || !formExpenseDate) {
      alert("Mohon lengkapi judul, nominal, properti, dan tanggal pengeluaran.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formTitle.trim(),
        category: formCategory,
        amount: parseFloat(formAmount),
        propertyId: formPropertyId,
        unitId: formUnitId || null,
        expenseDate: formExpenseDate,
        notes: formNotes.trim() || null,
        receiptUrl: formReceiptUrl || null,
      };

      const url = editingExpense
        ? `/api/finance/expenses/${editingExpense.id}`
        : "/api/finance/expenses";
      const method = editingExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan pengeluaran.");
      }

      setIsFormModalOpen(false);
      fetchExpenses(true);
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handler
  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/finance/expenses/${deletingExpense.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus data pengeluaran.");
      }
      setDeletingExpense(null);
      fetchExpenses(true);
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menghapus data.");
    } finally {
      setDeleting(false);
    }
  };

  // Handle receipt image upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingReceipt(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.url) {
        setFormReceiptUrl(json.url);
      } else {
        alert(json.message || "Gagal mengunggah file resi.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Terjadi kesalahan saat upload resi.");
    } finally {
      setUploadingReceipt(false);
    }
  };

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

  // Top category computation
  const topCategoryItem = stats.categoryBreakdown.length > 0
    ? [...stats.categoryBreakdown].sort((a, b) => b.totalAmount - a.totalAmount)[0]
    : null;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* --------------------------------------------------------------------- */}
      {/* HERO BANNER */}
      {/* --------------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              <IconSparkles className="h-3.5 w-3.5" />
              <span>ARV-FN-03 • Pengeluaran Operasional (OpEx)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Pengeluaran Operasional (OpEx)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pencatatan & pengawasan biaya operasional properti (Maintenance, Utilitas, Gaji Staf, Kebersihan, dan Pajak) yang terintegrasi secara realtime dengan database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              suppressHydrationWarning
              onClick={() => fetchExpenses(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white border border-white/15 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <IconRefresh className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Memperbarui..." : "Refresh"}</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <IconPlus className="h-4 w-4 stroke-[3]" />
              <span>Tambah Pengeluaran</span>
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-emerald-400 font-medium">
              Tersambung Ke Database • Data Properti Terverifikasi
            </span>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* KPI METRICS */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pengeluaran */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Total Pengeluaran (OpEx)
            </span>
            <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700">
              <IconCoin className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{formatIDR(stats.totalAmount)}</p>
            <p className="text-xs text-gray-500 font-medium">{stats.totalCount} total pengeluaran dicatat</p>
          </div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Pengeluaran Bulan Ini
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200">
              <IconCalendar className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-900">{formatIDR(stats.monthAmount)}</p>
            <p className="text-xs text-blue-700/80 font-medium">{stats.monthCount} transaksi bulan ini</p>
          </div>
        </div>

        {/* Kategori Terbesar */}
        <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              Kategori Terbesar
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200">
              <IconCategory className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-lg font-black text-purple-900 line-clamp-1">
              {topCategoryItem ? (CATEGORY_LABELS[topCategoryItem.category]?.label || topCategoryItem.category) : "Belum Ada"}
            </p>
            <p className="text-xs text-purple-700/80 font-medium">
              {topCategoryItem ? formatIDR(topCategoryItem.totalAmount) : "Rp 0"}
            </p>
          </div>
        </div>

        {/* Properti Tercover */}
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Properti Tercover
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
              <IconBuilding className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-900">{properties.length} Properti</p>
            <p className="text-xs text-emerald-700/80 font-medium">Sesuai Akses Akun</p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* FILTER TOOLBAR */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <IconSearch className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari pengeluaran, catatan, unit..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Property Dropdown */}
          <div>
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="ALL">Semua Properti ({properties.length})</option>
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
              className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
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
              className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          <span className="text-xs text-gray-500 font-bold mr-1 flex items-center gap-1">
            <IconFilter className="h-3.5 w-3.5 text-emerald-600" /> Kategori:
          </span>
          <button
            onClick={() => {
              setSelectedCategory("ALL");
              setPage(1);
            }}
            className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
          >
            Semua Kategori
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => (
            <button
              key={catKey}
              onClick={() => {
                setSelectedCategory(catKey);
                setPage(1);
              }}
              className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === catKey
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {catInfo.label}
            </button>
          ))}

          {(startDate || endDate || selectedPropertyId !== "ALL" || selectedCategory !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedPropertyId("ALL");
                setSelectedCategory("ALL");
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
      {/* TABLE DATA */}
      {/* --------------------------------------------------------------------- */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
          <IconX className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400 space-y-3">
            <IconLoader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold">Memuat data pengeluaran operasional...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <IconTools className="h-7 w-7" />
            </div>
            <p className="font-bold text-base text-gray-800">Tidak ada pengeluaran ditemukan</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Belum ada record pengeluaran yang sesuai dengan kriteria filter atau tugas properti Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-5 py-4">Judul & Catatan</th>
                  <th className="px-5 py-4">Kategori</th>
                  <th className="px-5 py-4">Properti & Unit</th>
                  <th className="px-5 py-4">Dicatat Oleh</th>
                  <th className="px-5 py-4">Tanggal</th>
                  <th className="px-5 py-4 text-right">Nominal (IDR)</th>
                  <th className="px-5 py-4 text-center">Resi</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {expenses.map((exp) => {
                  const catConfig = CATEGORY_LABELS[exp.category] || CATEGORY_LABELS.OTHER;
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900 text-sm">{exp.title}</div>
                        {exp.notes && (
                          <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{exp.notes}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold border ${catConfig.color}`}>
                          {catConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-700">
                        <div>{exp.property?.name || "Properti"}</div>
                        {exp.unit && (
                          <div className="text-[11px] text-emerald-700 font-bold">Unit {exp.unit.unitNumber}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-600 font-medium">
                        <div>{exp.createdBy?.fullName || "Staff"}</div>
                        <div className="text-[10px] text-gray-400 uppercase">{exp.createdBy?.role || "USER"}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-600">
                        {formatDate(exp.expenseDate)}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap font-black text-gray-900 font-mono text-sm">
                        {formatIDR(exp.amount)}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {exp.receiptUrl ? (
                          <button
                            onClick={() => setDetailExpense(exp)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            <IconPaperclip className="h-3.5 w-3.5" />
                            <span>Lihat Resi</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-normal">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-1">
                        <button
                          title="Lihat Detail"
                          onClick={() => setDetailExpense(exp)}
                          className="inline-flex items-center p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all cursor-pointer"
                        >
                          <IconEye className="h-4 w-4" />
                        </button>
                        <button
                          title="Edit Pengeluaran"
                          onClick={() => handleOpenEditModal(exp)}
                          className="inline-flex items-center p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-amber-700 transition-all cursor-pointer"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          title="Hapus Pengeluaran"
                          onClick={() => setDeletingExpense(exp)}
                          className="inline-flex items-center p-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-all cursor-pointer"
                        >
                          <IconTrash className="h-4 w-4" />
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
        {!loading && expenses.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 px-5 py-4 bg-gray-50/60 text-xs text-gray-600 gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Menampilkan <strong className="text-gray-900">{meta.totalCount > 0 ? (page - 1) * limit + 1 : 0}</strong> - <strong className="text-gray-900">{Math.min(page * limit, meta.totalCount || expenses.length)}</strong> dari <strong className="text-gray-900">{meta.totalCount || expenses.length}</strong> pengeluaran
              </span>

              <div className="flex items-center gap-1.5 text-gray-500">
                <span className="text-[11px]">Per halaman:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 shadow-2xs transition-all cursor-pointer"
              >
                <IconChevronLeft className="h-4 w-4" />
                <span>Sebelumnya</span>
              </button>

              {Array.from({ length: meta.totalPages || 1 }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.min(meta.totalPages || 1, page + 2))
                .map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      pageNum === page
                        ? "bg-slate-800 text-white shadow-2xs"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

              <button
                disabled={page >= (meta.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 shadow-2xs transition-all cursor-pointer"
              >
                <span>Selanjutnya</span>
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* FORM MODAL (CREATE / EDIT) */}
      {/* --------------------------------------------------------------------- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">
                {editingExpense ? "Edit Pengeluaran Operasional" : "Tambah Pengeluaran Operasional"}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Judul Pengeluaran */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Judul / Deskripsi Pengeluaran *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Misal: Pembayaran Listrik PLN Bulan September"
                  className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 font-semibold text-gray-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Kategori & Nominal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Kategori *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 font-bold text-gray-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => (
                      <option key={catKey} value={catKey}>
                        {catInfo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nominal Biaya (IDR) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="150000"
                    className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 font-mono font-bold text-gray-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Properti & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Properti *</label>
                  <select
                    required
                    value={formPropertyId}
                    onChange={(e) => {
                      setFormPropertyId(e.target.value);
                      setFormUnitId("");
                    }}
                    className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 font-bold text-gray-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Unit Spensifik (Opsional)</label>
                  <select
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 font-bold text-gray-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Umum (Seluruh Properti) --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        Unit {u.unitNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tanggal Pengeluaran */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tanggal Transaksi *</label>
                <input
                  type="date"
                  required
                  value={formExpenseDate}
                  onChange={(e) => setFormExpenseDate(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 font-bold text-gray-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Bukti Resi (Upload / URL) */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Bukti Resi / Nota (URL atau File Upload)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formReceiptUrl}
                    onChange={(e) => setFormReceiptUrl(e.target.value)}
                    placeholder="https://... atau upload file"
                    className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <label className="flex items-center gap-1 rounded-2xl bg-gray-100 hover:bg-gray-200 px-3 py-2.5 text-xs font-bold text-gray-700 shrink-0 cursor-pointer transition-all">
                    <IconUpload className={`h-4 w-4 ${uploadingReceipt ? "animate-bounce" : ""}`} />
                    <span>{uploadingReceipt ? "Uploading..." : "Upload"}</span>
                    <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                {formReceiptUrl && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1 truncate">
                    Resi terhubung: {formReceiptUrl}
                  </p>
                )}
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Catatan Keterangan (Opsional)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Keterangan tambahan rincian pengeluaran..."
                  className="w-full rounded-2xl border border-gray-200 p-3 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-2xl border border-gray-200 px-4 py-2.5 font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 font-black text-white shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <IconLoader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingExpense ? "Simpan Perubahan" : "Tambah Pengeluaran"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* DETAIL MODAL */}
      {/* --------------------------------------------------------------------- */}
      {detailExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Rincian Pengeluaran Operasional</h3>
              <button
                onClick={() => setDetailExpense(null)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
                <p className="text-[11px] text-gray-400 font-bold uppercase">Judul Transaksi</p>
                <p className="text-sm font-black text-gray-900">{detailExpense.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Nominal</p>
                  <p className="text-sm font-mono font-black text-emerald-700">
                    {formatIDR(detailExpense.amount)}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Kategori</p>
                  <p className="font-bold text-gray-800">
                    {CATEGORY_LABELS[detailExpense.category]?.label || detailExpense.category}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Properti & Unit</p>
                  <p className="font-bold text-gray-800">
                    {detailExpense.property?.name || "Properti"}
                    {detailExpense.unit && ` (Unit ${detailExpense.unit.unitNumber})`}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Tanggal Transaksi</p>
                  <p className="font-bold text-gray-800">{formatDate(detailExpense.expenseDate)}</p>
                </div>
              </div>

              {detailExpense.notes && (
                <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Catatan Keterangan</p>
                  <p className="text-gray-700 font-medium">{detailExpense.notes}</p>
                </div>
              )}

              {detailExpense.receiptUrl ? (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-700">Pratinjau Bukti Resi / Nota:</p>
                  <div className="rounded-2xl border border-gray-200 overflow-hidden max-h-56 bg-slate-900 flex items-center justify-center">
                    <img
                      src={detailExpense.receiptUrl}
                      alt="Resi Nota"
                      className="max-h-56 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <a
                    href={detailExpense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-bold text-blue-600 hover:underline"
                  >
                    Buka Resi di Tab Baru &rarr;
                  </a>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Tidak ada lampiran resi/nota.</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailExpense(null)}
                className="rounded-2xl bg-gray-900 hover:bg-gray-800 px-5 py-2 text-xs font-bold text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* --------------------------------------------------------------------- */}
      <ConfirmModal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDeleteExpense}
        title="Hapus Record Pengeluaran?"
        description={
          <span>
            Apakah Anda yakin ingin menghapus data pengeluaran{" "}
            <strong>&quot;{deletingExpense?.title}&quot;</strong> senilai{" "}
            <strong className="text-red-600 font-mono">
              {deletingExpense ? formatIDR(deletingExpense.amount) : "Rp 0"}
            </strong>
            ? Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        confirmText={deleting ? "Menghapus..." : "Ya, Hapus Data"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}

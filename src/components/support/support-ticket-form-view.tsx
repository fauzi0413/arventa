"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  IconHeadset,
  IconSend,
  IconTicket,
  IconLoader2,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconMessageCircle,
  IconClock,
  IconSparkles,
  IconArrowLeft,
  IconHelpCircle,
  IconPhone,
  IconMail,
  IconUser,
  IconShieldCheck,
  IconRefresh,
  IconLock,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface UserSupportTicket {
  id: string;
  ticketNumber: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string | null;
  category: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  source: string;
  adminReply?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_MAP: Record<string, { label: string; badge: string }> = {
  TECHNICAL_BUG: { label: "Kendala Teknis (Bug)", badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400" },
  SUBSCRIPTION_BILLING: { label: "Tagihan & Billing", badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400" },
  FEATURE_REQUEST: { label: "Usulan Fitur Baru", badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400" },
  ACCOUNT_ACCESS: { label: "Akses & Akun", badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400" },
  GENERAL: { label: "Pertanyaan Umum", badge: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300" },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  LOW: { label: "Rendah", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  MEDIUM: { label: "Sedang", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" },
  HIGH: { label: "Tinggi", color: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400" },
  URGENT: { label: "Darurat", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400" },
};

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  OPEN: { label: "BARU (OPEN)", badge: "bg-amber-500 text-white font-black" },
  IN_PROGRESS: { label: "DIPROSES", badge: "bg-blue-600 text-white font-black" },
  RESOLVED: { label: "SELESAI", badge: "bg-emerald-600 text-white font-black" },
  CLOSED: { label: "DITUTUP", badge: "bg-gray-500 text-white font-bold" },
};

export function SupportTicketFormView() {
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [myTickets, setMyTickets] = useState<UserSupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [category, setCategory] = useState("TECHNICAL_BUG");
  const [priority, setPriority] = useState("MEDIUM");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Toast State
  const [toastNotification, setToastNotification] = useState<{
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);

  // Search & Pagination States for History Tab
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Filtered & Paginated tickets
  const filteredTickets = myTickets.filter((ticket) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const catLabel = (CATEGORY_MAP[ticket.category]?.label || ticket.category).toLowerCase();
    const priorityLabel = (PRIORITY_MAP[ticket.priority]?.label || ticket.priority).toLowerCase();
    const statusLabel = (STATUS_MAP[ticket.status]?.label || ticket.status).toLowerCase();

    return (
      ticket.ticketNumber.toLowerCase().includes(q) ||
      ticket.subject.toLowerCase().includes(q) ||
      ticket.message.toLowerCase().includes(q) ||
      (ticket.adminReply && ticket.adminReply.toLowerCase().includes(q)) ||
      catLabel.includes(q) ||
      priorityLabel.includes(q) ||
      statusLabel.includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredTickets.length);
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Auto reset to page 1 on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const showToast = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string
  ) => {
    setToastNotification({ type, title, message });
    setTimeout(() => setToastNotification(null), 4500);
  };

  // Prefill authenticated user profile
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setReporterName(json.data.fullName || "");
          setReporterEmail(json.data.email || "");
          if (json.data.phoneNumber) setReporterPhone(json.data.phoneNumber);
          return;
        }
      } catch (err) {
        console.warn("Failed to prefill user info:", err);
      }

      if (typeof window !== "undefined") {
        const userEmailCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("arventa_user_email="))
          ?.split("=")[1];
        if (userEmailCookie) {
          setReporterEmail(decodeURIComponent(userEmailCookie));
        }
      }
    }
    loadUser();
  }, []);

  // Fetch my tickets
  const fetchMyTickets = useCallback(async () => {
    try {
      setLoadingTickets(true);
      const res = await fetch("/api/support-tickets");
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setMyTickets(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat tiket saya:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  // Load tickets on mount to populate tab count badge immediately
  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchMyTickets();
    }
  }, [activeTab, fetchMyTickets]);

  // Handle submit ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim() || !reporterEmail.trim() || !subject.trim() || !message.trim()) {
      showToast("warning", "Data Belum Lengkap", "Mohon isi nama, email, subjek, dan rincian keluhan Anda.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        reporterName: reporterName.trim(),
        reporterEmail: reporterEmail.trim(),
        reporterPhone: reporterPhone.trim() || null,
        category,
        priority,
        subject: subject.trim(),
        message: message.trim(),
      };

      const res = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengirimkan tiket laporan.");
      }

      showToast(
        "success",
        "Tiket Berhasil Terkirim!",
        `Laporan #${json.data.ticketNumber} telah diterima oleh Tim Support Arventa. Kami akan segera menindaklanjuti.`
      );

      // Reset form fields
      setSubject("");
      setMessage("");
      setActiveTab("history");
      fetchMyTickets();
    } catch (err: any) {
      showToast("error", "Gagal Mengirim", err.message || "Terjadi kesalahan saat mengirim tiket laporan.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur-xs">
                <IconShieldCheck className="h-3.5 w-3.5" />
                Helpdesk & Support Arventa
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pusat Layanan & Pengaduan Kendala
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Ada pertanyaan sistem, kendala teknis (bug), tagihan billing, atau masukan fitur? Kirimkan laporan tiket Anda di sini dan tim support kami akan langsung merespon.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/owner/faq"
              className="flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <IconHelpCircle className="h-4 w-4" />
              <span>Buka FAQ & Bantuan</span>
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${activeTab === "create"
              ? "bg-slate-900 text-white shadow-md dark:bg-emerald-600"
              : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-slate-900 dark:text-gray-300"
            }`}
        >
          <IconHeadset className="h-4 w-4" />
          <span>Buat Laporan / Keluhan Baru</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${activeTab === "history"
              ? "bg-slate-900 text-white shadow-md dark:bg-emerald-600"
              : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-slate-900 dark:text-gray-300"
            }`}
        >
          <IconTicket className="h-4 w-4" />
          <span>Riwayat Tiket Saya</span>
          {myTickets.length > 0 && (
            <span className="ml-1 rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-black">
              {myTickets.length}
            </span>
          )}
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: FORM BUAT LAPORAN */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === "create" && (
        <Card className="rounded-3xl border-gray-200/80 shadow-xs bg-white dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="p-6 pb-4 border-b border-gray-100 dark:border-slate-800">
            <CardTitle className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <IconHeadset className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Formulir Tiket Pengaduan
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
              Laporan yang Anda kirimkan akan otomatis masuk ke antrian helpdesk Tim Admin Support ARVENTA.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmitTicket} className="space-y-5 text-xs">
              {/* Row 1: Nama & Email (Readonly) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <IconUser className="h-3.5 w-3.5 text-gray-400" />
                      Nama Lengkap Pelapor <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-0.5">
                      <IconLock className="h-3 w-3" /> Otomatis Akun
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={reporterName}
                    placeholder="Memuat nama akun..."
                    className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-100/90 dark:bg-slate-800/90 px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300 cursor-not-allowed select-none focus:outline-none transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <IconMail className="h-3.5 w-3.5 text-gray-400" />
                      Email Pelapor <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-0.5">
                      <IconLock className="h-3 w-3" /> Otomatis Akun
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    readOnly
                    value={reporterEmail}
                    placeholder="Memuat email akun..."
                    className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-100/90 dark:bg-slate-800/90 px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300 cursor-not-allowed select-none focus:outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 2: Kategori & Prioritas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Kategori Kendala <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 font-bold text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="TECHNICAL_BUG">Kendala Teknis (Bug / Error Sistem)</option>
                    <option value="SUBSCRIPTION_BILLING">Tagihan, Faktur & Billing SaaS</option>
                    <option value="FEATURE_REQUEST">Usulan Fitur Baru / Saran Pengembangan</option>
                    <option value="ACCOUNT_ACCESS">Masalah Akses Akun & Login</option>
                    <option value="GENERAL">Pertanyaan Umum & Bantuan Operasional</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Tingkat Prioritas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 font-bold text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="LOW">Rendah (Pertanyaan umum / Tidak mendesak)</option>
                    <option value="MEDIUM">Sedang (Kendala standar operasional)</option>
                    <option value="HIGH">Tinggi (Fitur utama terganggu)</option>
                    <option value="URGENT">Darurat (Sistem berhenti / Transaksi terhambat)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Kontak WhatsApp & Subjek Tiket */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                    <IconPhone className="h-3.5 w-3.5 text-gray-400" />
                    Nomor WhatsApp / Telepon <span className="text-gray-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="Misal: 081234567890"
                    className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 font-semibold text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Subjek / Judul Kendala <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Misal: Tombol Download Kuitansi Tidak Merespon"
                    className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 font-bold text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Rincian Pesan / Keluhan */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Rincian Deskripsi Masalah / Keluhan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Jelaskan secara rinci kronologi kendala, halaman yang bermasalah, atau pertanyaan yang ingin Anda sampaikan..."
                  className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-xs text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Submit Action */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                <p className="text-[11px] text-gray-400">
                  Tim Support kami biasanya merespon tiket dalam waktu 1x24 jam kerja.
                </p>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 font-black text-white shadow-md hover:shadow-emerald-500/20 cursor-pointer"
                >
                  {submitting ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconSend className="h-4 w-4" />}
                  <span>{submitting ? "Mengirimkan Tiket..." : "Kirim Laporan Tiket"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: RIWAYAT TIKET SAYA */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <IconTicket className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Daftar Tiket & Respon Admin
            </h3>

            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no. tiket, subjek, respon..."
                className="w-full pl-9.5 pr-8 py-2 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {loadingTickets ? (
            <div className="py-16 text-center text-gray-400">
              <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-2" />
              <p className="text-xs font-bold">Memuat riwayat tiket laporan Anda...</p>
            </div>
          ) : myTickets.length === 0 ? (
            <Card className="rounded-3xl border-gray-200 bg-white dark:bg-slate-900 p-12 text-center">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-gray-400 mb-3">
                <IconTicket className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white">Belum Ada Tiket Laporan</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Anda belum pernah mengirimkan laporan kendala atau tiket bantuan ke Tim Support Arventa.
              </p>
              <Button
                onClick={() => setActiveTab("create")}
                className="mt-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Buat Laporan Pertama
              </Button>
            </Card>
          ) : filteredTickets.length === 0 ? (
            <Card className="rounded-3xl border-gray-200 bg-white dark:bg-slate-900 p-10 text-center space-y-3">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-gray-400">
                <IconSearch className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white">Tidak Ada Tiket yang Cocok</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tidak ditemukan tiket yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="rounded-xl text-xs font-bold"
              >
                Reset Pencarian
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {paginatedTickets.map((ticket) => {
                const catInfo = CATEGORY_MAP[ticket.category] || { label: ticket.category, badge: "bg-gray-100" };
                const priorityInfo = PRIORITY_MAP[ticket.priority] || { label: ticket.priority, color: "bg-gray-100" };
                const statusInfo = STATUS_MAP[ticket.status] || { label: ticket.status, badge: "bg-gray-500" };

                return (
                  <Card key={ticket.id} className="rounded-3xl border-gray-200/80 shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
                            {ticket.ticketNumber}
                          </span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${catInfo.badge}`}>
                            {catInfo.label}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${priorityInfo.color}`}>
                            Prioritas: {priorityInfo.label}
                          </span>
                        </div>

                        <Badge className={`text-[10px] px-3 py-1 rounded-full ${statusInfo.badge}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="space-y-2 text-xs">
                        <h4 className="text-sm font-black text-gray-900 dark:text-white">
                          {ticket.subject}
                        </h4>
                        <p className="text-gray-700 dark:text-slate-300 leading-relaxed bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                          {ticket.message}
                        </p>
                      </div>

                      {/* Admin Reply Section (if answered) */}
                      {ticket.adminReply ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-900/50 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                              <IconMessageCircle className="h-4 w-4 text-emerald-600" />
                              Tanggapan / Solusi Tim Support:
                            </span>
                            {ticket.resolvedAt && (
                              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                Diselesaikan: {formatDate(ticket.resolvedAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-emerald-950 dark:text-emerald-100 leading-relaxed whitespace-pre-wrap">
                            {ticket.adminReply}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 italic">
                          <IconClock className="h-3.5 w-3.5" />
                          <span>Menunggu tanggapan dari Tim Support...</span>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                        <span>Dikirim pada: {formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Menampilkan <span className="font-bold text-gray-900 dark:text-white">{startIndex + 1}</span> - <span className="font-bold text-gray-900 dark:text-white">{endIndex}</span> dari <span className="font-bold text-gray-900 dark:text-white">{filteredTickets.length}</span> tiket
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                      title="Halaman Sebelumnya"
                    >
                      <IconChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 min-w-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentPage === page
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-2xs"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                      title="Halaman Selanjutnya"
                    >
                      <IconChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-60 flex max-w-sm items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 dark:bg-slate-900 dark:border-slate-800">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${toastNotification.type === "success"
                ? "bg-emerald-600 shadow-emerald-600/30"
                : toastNotification.type === "error"
                  ? "bg-rose-600 shadow-rose-600/30"
                  : toastNotification.type === "warning"
                    ? "bg-amber-500 shadow-amber-500/30"
                    : "bg-blue-600 shadow-blue-600/30"
              }`}
          >
            {toastNotification.type === "success" && <IconCheck className="h-5 w-5" />}
            {toastNotification.type === "error" && <IconX className="h-5 w-5" />}
            {toastNotification.type === "warning" && <IconAlertCircle className="h-5 w-5" />}
            {toastNotification.type === "info" && <IconSparkles className="h-5 w-5" />}
          </div>
          <div className="flex-1 text-xs pr-2">
            <h4 className="font-bold text-gray-900 dark:text-white">{toastNotification.title}</h4>
            <p className="mt-0.5 font-medium text-gray-600 dark:text-slate-300 leading-relaxed">
              {toastNotification.message}
            </p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer p-0.5"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconTicket,
  IconSearch,
  IconRefresh,
  IconLoader2,
  IconCheck,
  IconX,
  IconPlus,
  IconClock,
  IconAlertCircle,
  IconEye,
  IconMessageCircle,
  IconUser,
  IconMail,
  IconPhone,
  IconFilter,
  IconSparkles,
  IconTrash,
  IconHelpCircle,
  IconSend,
  IconChecklist,
  IconShieldCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface SupportTicketItem {
  id: string;
  ticketNumber: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string | null;
  category: "GENERAL" | "SUBSCRIPTION_BILLING" | "TECHNICAL_BUG" | "FEATURE_REQUEST" | "ACCOUNT_ACCESS" | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | string;
  source: string;
  assignedTo?: string | null;
  adminReply?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function SupportTicketManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  // Modal States
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("OPEN");
  const [assignedToInput, setAssignedToInput] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Convert to FAQ modal state
  const [isConvertFaqOpen, setIsConvertFaqOpen] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqCategory, setFaqCategory] = useState("GENERAL");
  const [isCreatingFaq, setIsCreatingFaq] = useState(false);

  // In-App Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
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

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== "ALL") queryParams.append("status", statusFilter);
      if (priorityFilter !== "ALL") queryParams.append("priority", priorityFilter);
      if (categoryFilter !== "ALL") queryParams.append("category", categoryFilter);
      if (searchQuery.trim()) queryParams.append("query", searchQuery.trim());

      const res = await fetch(`/api/admin/support-tickets?${queryParams.toString()}`, { cache: "no-store" });
      const json = await res.json();

      if (json.success && json.data) {
        setTickets(json.data.tickets || []);
        if (json.data.stats) {
          setStats(json.data.stats);
        }
      }
    } catch (error) {
      console.error("Failed to fetch support tickets:", error);
      showToast("error", "Gagal memuat data tiket laporan support");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const handleOpenDetailModal = (ticket: SupportTicketItem) => {
    setSelectedTicket(ticket);
    setAdminReplyText(ticket.adminReply || "");
    setSelectedStatus(ticket.status || "OPEN");
    setAssignedToInput(ticket.assignedTo || "");
  };

  const handleSaveReplyAndStatus = async () => {
    if (!selectedTicket) return;
    setIsSubmittingReply(true);

    try {
      const res = await fetch(`/api/admin/support-tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminReply: adminReplyText,
          status: selectedStatus,
          assignedTo: assignedToInput,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("success", `Tiket ${selectedTicket.ticketNumber} berhasil diperbarui`);
        setSelectedTicket(null);
        fetchTickets();
      } else {
        showToast("error", json.message || "Gagal memperbarui tiket");
      }
    } catch (err) {
      console.error("Failed to update ticket:", err);
      showToast("error", "Terjadi kesalahan jaringan saat menyimpan");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketNumber: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tiket ${ticketNumber}?`)) return;

    try {
      const res = await fetch(`/api/admin/support-tickets/${ticketId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (json.success) {
        showToast("success", `Tiket ${ticketNumber} berhasil dihapus`);
        if (selectedTicket?.id === ticketId) setSelectedTicket(null);
        fetchTickets();
      } else {
        showToast("error", json.message || "Gagal menghapus tiket");
      }
    } catch (err) {
      console.error("Delete ticket error:", err);
      showToast("error", "Gagal menghapus tiket support");
    }
  };

  const handleOpenConvertFaqModal = () => {
    if (!selectedTicket) return;
    setFaqQuestion(selectedTicket.subject);
    setFaqAnswer(
      adminReplyText.trim()
        ? adminReplyText
        : `${selectedTicket.message}\n\nPenanganan Resmi Admin: ${selectedTicket.subject}`
    );
    setFaqCategory(
      selectedTicket.category === "SUBSCRIPTION_BILLING"
        ? "BILLING"
        : selectedTicket.category === "TECHNICAL_BUG"
        ? "TECHNICAL"
        : "GENERAL"
    );
    setIsConvertFaqOpen(true);
  };

  const handleSaveConvertedFaq = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      showToast("error", "Pertanyaan dan Jawaban FAQ tidak boleh kosong");
      return;
    }

    setIsCreatingFaq(true);
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: faqQuestion,
          answer: faqAnswer,
          category: faqCategory,
          targetRole: "ALL",
          isPublished: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("success", "Tiket laporan berhasil dikonversi menjadi item FAQ publik!");
        setIsConvertFaqOpen(false);
      } else {
        showToast("error", json.message || "Gagal mengonversi ke FAQ");
      }
    } catch (err) {
      console.error("Convert FAQ error:", err);
      showToast("error", "Terjadi kesalahan saat menyimpan FAQ baru");
    } finally {
      setIsCreatingFaq(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <Badge className="bg-rose-600 text-white font-extrabold">URGENT</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-500 text-white font-bold">TINGGI</Badge>;
      case "MEDIUM":
        return <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold">SEDANG</Badge>;
      case "LOW":
      default:
        return <Badge variant="outline" className="text-muted-foreground text-xs">RENDAH</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-amber-500 text-slate-950 font-bold">BARU (OPEN)</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-600 text-white font-bold">DIPROSES</Badge>;
      case "RESOLVED":
        return <Badge className="bg-emerald-600 text-white font-bold">SELESAI (RESOLVED)</Badge>;
      case "CLOSED":
        return <Badge variant="outline" className="text-muted-foreground">DITUTUP (CLOSED)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "SUBSCRIPTION_BILLING":
        return "Tagihan & Billing";
      case "TECHNICAL_BUG":
        return "Kendala Teknis (Bug)";
      case "FEATURE_REQUEST":
        return "Usulan Fitur";
      case "ACCOUNT_ACCESS":
        return "Akses Akun";
      case "GENERAL":
      default:
        return "Pertanyaan Umum";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl border font-semibold text-xs flex items-center gap-2 max-w-md animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-500/15 border-rose-500/30 text-rose-800 dark:text-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? <IconCheck className="size-4 shrink-0 text-emerald-600" /> : <IconX className="size-4 shrink-0 text-rose-600" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-card border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
              <IconTicket className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground">Tiket Management Laporan Support</h1>
              <p className="text-xs text-muted-foreground">
                Pusat penanganan laporan kendala, pertanyaan billing, dan tiket helpdesk pengirim platform ARVENTA.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchTickets} disabled={loading} className="gap-2 text-xs font-semibold">
            <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => router.push("/platform/faq")} className="gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs">
            <IconHelpCircle className="size-4" /> Kelola FAQ Landing Page
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Tiket Masuk</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{stats.total}</h3>
            </div>
            <div className="size-10 rounded-xl bg-muted/60 flex items-center justify-center text-foreground font-bold">
              <IconTicket className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Tiket Baru (Open)</p>
              <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{stats.open}</h3>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <IconAlertCircle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-blue-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Sedang Diproses</p>
              <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">{stats.inProgress}</h3>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <IconClock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Tiket Terselesaikan</p>
              <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats.resolved}</h3>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <IconShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari no. tiket, nama pengirim, email, atau subjek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-background border border-input focus:outline-none font-semibold text-foreground"
              >
                <option value="ALL">Semua Status</option>
                <option value="OPEN">BARU (OPEN)</option>
                <option value="IN_PROGRESS">DIPROSES</option>
                <option value="RESOLVED">SELESAI</option>
                <option value="CLOSED">DITUTUP</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-background border border-input focus:outline-none font-semibold text-foreground"
              >
                <option value="ALL">Semua Prioritas</option>
                <option value="URGENT">URGENT</option>
                <option value="HIGH">TINGGI</option>
                <option value="MEDIUM">SEDANG</option>
                <option value="LOW">RENDAH</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-background border border-input focus:outline-none font-semibold text-foreground"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="SUBSCRIPTION_BILLING">Tagihan & Billing</option>
                <option value="TECHNICAL_BUG">Kendala Teknis (Bug)</option>
                <option value="FEATURE_REQUEST">Usulan Fitur</option>
                <option value="ACCOUNT_ACCESS">Akses Akun</option>
                <option value="GENERAL">Pertanyaan Umum</option>
              </select>

              <Button size="sm" variant="secondary" onClick={fetchTickets} className="gap-1.5 text-xs font-bold">
                <IconFilter className="size-4" /> Filter
              </Button>
            </div>
          </div>

          {/* Tickets Data Table */}
          <div className="border rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <IconLoader2 className="size-7 animate-spin text-amber-500" />
                <p className="text-xs font-medium">Memuat daftar tiket laporan support...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-muted-foreground gap-2 text-center">
                <IconTicket className="size-10 text-muted-foreground/40" />
                <p className="text-sm font-bold text-foreground">Tidak Ada Tiket Laporan Support</p>
                <p className="text-xs max-w-sm">Belum ada tiket laporan yang sesuai dengan filter atau kata kunci pencarian Anda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/60 text-muted-foreground font-extrabold uppercase tracking-wider text-[10px] border-b">
                      <th className="p-3.5">Nomor & Subjek Tiket</th>
                      <th className="p-3.5">Pengirim Laporan</th>
                      <th className="p-3.5">Kategori</th>
                      <th className="p-3.5">Prioritas</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Tgl Dibuat</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 block">
                            {t.ticketNumber}
                          </span>
                          <span className="font-bold text-foreground line-clamp-1 mt-0.5" title={t.subject}>
                            {t.subject}
                          </span>
                        </td>
                        <td className="p-3.5 space-y-0.5">
                          <p className="font-bold text-foreground">{t.reporterName}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{t.reporterEmail}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-lg bg-muted border text-[11px] font-semibold text-foreground">
                            {getCategoryLabel(t.category)}
                          </span>
                        </td>
                        <td className="p-3.5">{getPriorityBadge(t.priority)}</td>
                        <td className="p-3.5">{getStatusBadge(t.status)}</td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground">{formatDate(t.createdAt)}</td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDetailModal(t)}
                              className="gap-1 h-7 text-[11px] font-bold"
                            >
                              <IconMessageCircle className="size-3.5" /> Detail & Respon
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTicket(t.id, t.ticketNumber)}
                              className="size-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DETAIL & ADMIN REPLY MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl bg-card border shadow-2xl p-6 space-y-5 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                  <IconTicket className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Detail Tiket #{selectedTicket.ticketNumber}</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">Dibuat pada {formatDate(selectedTicket.createdAt)}</p>
                </div>
              </div>

              <button onClick={() => setSelectedTicket(null)} className="text-muted-foreground hover:text-foreground p-1">
                <IconX className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Reporter Info Header */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/40 border">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Pengirim:</p>
                  <p className="font-extrabold text-foreground mt-0.5">{selectedTicket.reporterName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Email Kontak:</p>
                  <p className="font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">{selectedTicket.reporterEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">No. Telepon / WA:</p>
                  <p className="font-semibold text-foreground font-mono mt-0.5">{selectedTicket.reporterPhone || "-"}</p>
                </div>
              </div>

              {/* Subject & Report Message Box */}
              <div className="space-y-1.5 p-4 rounded-xl border bg-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-sm text-foreground">{selectedTicket.subject}</span>
                  <div className="flex items-center gap-1.5">
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap pt-2 border-t font-sans text-xs">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Admin Reply & Status Form */}
              <div className="space-y-3 p-4 rounded-xl border bg-amber-500/5 border-amber-500/20">
                <div className="flex items-center justify-between">
                  <label className="font-black text-xs text-foreground flex items-center gap-1.5">
                    <IconMessageCircle className="size-4 text-amber-500" />
                    <span>Tanggapan / Respon Resmi Admin Platform:</span>
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenConvertFaqModal}
                    className="gap-1.5 text-[11px] font-bold h-7 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  >
                    <IconSparkles className="size-3.5" /> Jadikan FAQ Publik
                  </Button>
                </div>

                <textarea
                  rows={4}
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Tuliskan respon atau penjelasan resmi dari platform ARVENTA untuk laporan ini..."
                  className="w-full p-3 rounded-xl bg-background border border-input text-xs font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Update Status Tiket:</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs font-bold text-foreground focus:outline-none"
                    >
                      <option value="OPEN">BARU (OPEN)</option>
                      <option value="IN_PROGRESS">DIPROSES (IN_PROGRESS)</option>
                      <option value="RESOLVED">SELESAI (RESOLVED)</option>
                      <option value="CLOSED">DITUTUP (CLOSED)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Tim Penanggung Jawab:</label>
                    <input
                      type="text"
                      value={assignedToInput}
                      onChange={(e) => setAssignedToInput(e.target.value)}
                      placeholder="Contoh: Tim IT Support / Tim Billing"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs font-semibold text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="text-xs">
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveReplyAndStatus}
                  disabled={isSubmittingReply}
                  className="gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-5"
                >
                  {isSubmittingReply ? <IconLoader2 className="size-4 animate-spin" /> : <IconSend className="size-4" />}
                  Simpan Respon & Update
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT TO FAQ MODAL */}
      {isConvertFaqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-card border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <IconSparkles className="size-5 text-amber-500" />
                <h3 className="text-sm font-black text-foreground">Jadikan Item FAQ Publik</h3>
              </div>
              <button onClick={() => setIsConvertFaqOpen(false)} className="text-muted-foreground hover:text-foreground">
                <IconX className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted-foreground block mb-1">Kategori FAQ:</label>
                <select
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs font-bold text-foreground"
                >
                  <option value="GENERAL">GENERAL (Umum)</option>
                  <option value="SUBSCRIPTION">SUBSCRIPTION (Langganan)</option>
                  <option value="BILLING">BILLING (Pembayaran)</option>
                  <option value="FEATURES">FEATURES (Fitur Platform)</option>
                  <option value="TECHNICAL">TECHNICAL (Teknis)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Pertanyaan FAQ:</label>
                <input
                  type="text"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs font-semibold text-foreground"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Jawaban FAQ Publik:</label>
                <textarea
                  rows={4}
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  className="w-full p-3 rounded-xl bg-background border border-input text-xs font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button size="sm" variant="ghost" onClick={() => setIsConvertFaqOpen(false)}>
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveConvertedFaq}
                  disabled={isCreatingFaq}
                  className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                >
                  {isCreatingFaq && <IconLoader2 className="size-3.5 animate-spin" />}
                  Simpan Ke FAQ Publik
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

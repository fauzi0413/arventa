"use client";

import React, { useState, useEffect } from "react";
import {
  IconShieldCheck,
  IconSearch,
  IconRefresh,
  IconLoader2,
  IconCheck,
  IconX,
  IconClock,
  IconAlertCircle,
  IconEye,
  IconZoomIn,
  IconCash,
  IconBuildingStore,
  IconFilter,
  IconReceipt,
  IconSparkles,
  IconBan,
  IconDownload,
  IconExternalLink,
  IconChecklist,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VerificationItem {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  ownerName: string;
  ownerEmail: string;
  planName: string;
  amount: number;
  status: "PENDING" | "PENDING_VERIFICATION" | "PAID" | "CANCELLED" | "EXPIRED";
  paymentProof?: string | null;
  bankName?: string;
  senderName?: string;
  transferRef?: string;
  dueDate: string;
  paidAt?: string | null;
  createdAt: string;
}

const FALLBACK_VERIFICATIONS: VerificationItem[] = [
  {
    id: "inv-ver-1",
    invoiceNumber: "INV-2026-881902",
    subscriptionId: "sub-2",
    ownerName: "Budi Santoso",
    ownerEmail: "budi.owner@gmail.com",
    planName: "Business Pro Tier",
    amount: 1499000,
    status: "PENDING",
    paymentProof: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80",
    bankName: "Bank BCA",
    senderName: "Budi Santoso",
    transferRef: "BCA-TRX-99812",
    dueDate: "2026-08-25T00:00:00.000Z",
    paidAt: null,
    createdAt: "2026-08-20T09:30:00.000Z",
  },
  {
    id: "inv-ver-2",
    invoiceNumber: "INV-2026-881905",
    subscriptionId: "sub-5",
    ownerName: "Agus Setiawan",
    ownerEmail: "agus.kost@gmail.com",
    planName: "Standard Tier",
    amount: 499000,
    status: "PENDING",
    paymentProof: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    bankName: "Bank Mandiri",
    senderName: "Agus Setiawan",
    transferRef: "MDR-887123",
    dueDate: "2026-08-24T00:00:00.000Z",
    paidAt: null,
    createdAt: "2026-08-20T11:15:00.000Z",
  },
  {
    id: "inv-ver-3",
    invoiceNumber: "INV-2026-881901",
    subscriptionId: "sub-1",
    ownerName: "Fauzi Aditya Pratama",
    ownerEmail: "fauzi@arventa.id",
    planName: "Enterprise Custom Tier",
    amount: 2999000,
    status: "PAID",
    paymentProof: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    bankName: "Bank BRI",
    senderName: "Fauzi Aditya",
    transferRef: "BRI-771239",
    dueDate: "2026-08-20T00:00:00.000Z",
    paidAt: "2026-08-20T10:15:00.000Z",
    createdAt: "2026-08-18T08:00:00.000Z",
  },
  {
    id: "inv-ver-4",
    invoiceNumber: "INV-2026-881904",
    subscriptionId: "sub-4",
    ownerName: "Hendra Wijaya",
    ownerEmail: "hendra.property@outlook.com",
    planName: "Starter Tier",
    amount: 199000,
    status: "CANCELLED",
    paymentProof: null,
    bankName: "Bank Danamon",
    senderName: "Hendra W",
    transferRef: "DNM-00129",
    dueDate: "2026-08-05T00:00:00.000Z",
    paidAt: null,
    createdAt: "2026-08-01T15:00:00.000Z",
  },
];

export function PaymentVerificationManager() {
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"PENDING" | "PAID" | "CANCELLED" | "ALL">("PENDING");

  const [searchQuery, setSearchQuery] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);

  // Detail & Zoom Modal State
  const [selectedProofItem, setSelectedProofItem] = useState<VerificationItem | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Rejection Dialog State
  const [rejectModalItem, setRejectModalItem] = useState<VerificationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("Nominal transfer tidak sesuai dengan invoice");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

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

  const renderStatusBadge = (status: string, paymentProof?: string | null) => {
    if (status === "PAID") {
      return (
        <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-0.5 gap-1">
          <IconCheck className="size-3" /> LUNAS & AKTIF
        </Badge>
      );
    }
    if (status === "PENDING_VERIFICATION" || (status === "PENDING" && Boolean(paymentProof))) {
      return (
        <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 gap-1 shadow-xs">
          <IconClock className="size-3 animate-pulse" /> MENUNGGU VERIFIKASI
        </Badge>
      );
    }
    if (status === "PENDING") {
      return (
        <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[10px] px-2.5 py-0.5 gap-1">
          <IconAlertCircle className="size-3" /> BELUM DIBAYAR
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground text-[10px] font-semibold px-2 py-0.5">
        DIBATALKAN / EXPIRED
      </Badge>
    );
  };

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/subscriptions", { cache: "no-store" });
      const json = await res.json();
      let loadedItems: VerificationItem[] = [];

      if (json.success && json.data && json.data.invoices && json.data.invoices.length > 0) {
        loadedItems = json.data.invoices.map((inv: any) => ({
          ...inv,
          bankName: inv.bankName || "Transfer Bank Direct",
          senderName: inv.ownerName,
          transferRef: inv.transferRef || `TRX-${inv.invoiceNumber.slice(-6)}`,
        }));
        setVerifications(loadedItems);
      } else {
        loadedItems = FALLBACK_VERIFICATIONS;
        setVerifications(loadedItems);
      }

      // Auto-open audit modal if invoiceId or id query parameter exists
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const targetInvoiceId = urlParams.get("invoiceId") || urlParams.get("id");
        if (targetInvoiceId) {
          const matchItem = loadedItems.find(
            (v) => v.id === targetInvoiceId || v.invoiceNumber === targetInvoiceId
          );
          if (matchItem) {
            setSelectedProofItem(matchItem);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load verification items:", err);
      setVerifications(FALLBACK_VERIFICATIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprovePayment = async (invoiceId: string) => {
    setIsSubmitting(true);
    setModalErrorMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_INVOICE",
          invoiceId,
          status: "PAID",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Pembayaran invoice berhasil disetujui & fitur SaaS owner diaktifkan!`);
        setSelectedProofItem(null);
        setModalErrorMsg(null);
        fetchData();
      } else {
        setModalErrorMsg(json.message || "Gagal menyetujui verifikasi pembayaran");
        setErrorMsg(json.message || "Gagal menyetujui verifikasi pembayaran");
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Terjadi kesalahan sistem saat memproses persetujuan.");
      setErrorMsg("Terjadi kesalahan sistem saat memproses persetujuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectModalItem) return;
    setIsSubmitting(true);
    setModalErrorMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json text/plain" },
        body: JSON.stringify({
          action: "VERIFY_INVOICE",
          invoiceId: rejectModalItem.id,
          status: "CANCELLED",
          reason: rejectionReason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Bukti pembayaran invoice ${rejectModalItem.invoiceNumber} berhasil ditolak.`);
        setRejectModalItem(null);
        setSelectedProofItem(null);
        setModalErrorMsg(null);
        fetchData();
      } else {
        setModalErrorMsg(json.message || "Gagal menolak pembayaran");
        setErrorMsg(json.message || "Gagal menolak pembayaran");
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Terjadi kesalahan sistem saat menolak pembayaran.");
      setErrorMsg("Terjadi kesalahan sistem saat menolak pembayaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = verifications.filter((item) => {
    const isPendingMatch =
      item.status === "PENDING_VERIFICATION" ||
      item.status === "PENDING";

    const matchesTab =
      activeTab === "ALL" ||
      (activeTab === "PENDING" ? isPendingMatch : item.status === activeTab);

    const matchesQuery =
      item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.transferRef && item.transferRef.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesQuery;
  });

  const pendingCount = verifications.filter(
    (v) => v.status === "PENDING_VERIFICATION" || v.status === "PENDING"
  ).length;
  const paidCount = verifications.filter((v) => v.status === "PAID").length;
  const cancelledCount = verifications.filter(
    (v) => v.status === "CANCELLED" || v.status === "EXPIRED"
  ).length;

  return (
    <div className="space-y-6">
      {/* ARVENTA Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconShieldCheck className="mr-1 size-3.5 text-[#C8A96B]" /> PAYMENT VERIFICATION DESK
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Verifikasi Pembayaran & Bukti Transfer
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300">
              Audit dan konfirmasi bukti transfer Bank/QRIS dari owner properti untuk mengaktifkan paket langganan SaaS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={fetchData}
              variant="outline"
              className="gap-1.5 font-bold text-xs rounded-xl border-[#383E36] bg-[#1E221E] text-gray-200 hover:bg-[#383E36]"
            >
              <IconRefresh className="size-4" /> Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Menunggu Verifikasi</p>
              <h3 className="text-xl font-black tracking-tight text-amber-600 dark:text-amber-400 mt-1">
                {pendingCount} Pengajuan
              </h3>
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 font-semibold">
                Perlu audit admin
              </p>
            </div>
            <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <IconClock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Disetujui & Aktif</p>
              <h3 className="text-xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                {paidCount} Terverifikasi
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Berhasil masuk ke kas SaaS</p>
            </div>
            <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <IconCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Ditolak / Batal</p>
              <h3 className="text-xl font-black tracking-tight text-muted-foreground mt-1">
                {cancelledCount} Pengajuan
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Transfer tidak valid</p>
            </div>
            <div className="size-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center border">
              <IconBan className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <IconCheck className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2">
            <IconX className="size-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconChecklist className="size-5 text-amber-500" />
              Antrean Verifikasi Pembayaran ({filteredItems.length} Item)
            </CardTitle>
            <CardDescription>
              Periksa bukti resi transfer, nama rekening pengirim, dan konfirmasi aktifasi fitur SaaS owner.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <IconSearch className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari Invoice / Owner / Bank / Ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border bg-background pl-9 pr-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </CardHeader>

        {/* Tab Selection */}
        <div className="px-6 border-b flex flex-wrap gap-2 pb-3">
          {[
            { id: "PENDING", label: `Menunggu Verifikasi (${pendingCount})`, icon: IconClock },
            { id: "PAID", label: `Terverifikasi Lunas (${paidCount})`, icon: IconCheck },
            { id: "CANCELLED", label: `Ditolak / Batal (${cancelledCount})`, icon: IconBan },
            { id: "ALL", label: `Semua Status (${verifications.length})`, icon: IconFilter },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-xs font-bold gap-1.5 h-8 rounded-xl transition-all ${
                  isActive
                    ? "bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white shadow-xs"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        <CardContent className="pt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <IconLoader2 className="size-8 animate-spin text-amber-500" />
              <p className="text-xs font-semibold text-muted-foreground">Memuat data verifikasi pembayaran...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center p-12 space-y-3 border border-dashed rounded-2xl bg-muted/20">
              <IconShieldCheck className="size-10 text-muted-foreground mx-auto opacity-50" />
              <h4 className="font-bold text-sm">Tidak Ada Item Pembayaran</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tidak ada pengajuan verifikasi pembayaran yang sesuai dengan kriteria filter tab saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const isPending = item.status === "PENDING" || item.status === "PENDING_VERIFICATION";
                const isPaid = item.status === "PAID";
                const isCancelled = item.status === "CANCELLED" || item.status === "EXPIRED";

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between space-y-4 bg-card ${
                      isPending
                        ? "border-amber-500/40 shadow-sm bg-amber-500/[0.02]"
                        : "border-border/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Row Header */}
                      <div className="flex items-center justify-between gap-2 border-b pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black font-mono text-sm text-foreground">
                              {item.invoiceNumber}
                            </span>
                            <Badge variant="secondary" className="text-[9px] font-bold">
                              {item.planName}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            Dibuat: {formatDate(item.createdAt)}
                          </p>
                        </div>

                        {renderStatusBadge(item.status, item.paymentProof)}
                      </div>

                      {/* Content Body Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Owner & Bank Info */}
                        <div className="space-y-1 bg-muted/30 p-3 rounded-xl border border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-extrabold">Data Pembayar:</p>
                          <p className="font-extrabold text-foreground">{item.ownerName}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">{item.ownerEmail}</p>
                          <div className="pt-1 text-[11px] font-mono text-muted-foreground">
                            <span>Metode: {item.bankName || "Transfer Bank"}</span>
                            {item.transferRef && <p>Ref: {item.transferRef}</p>}
                          </div>
                        </div>

                        {/* Nominal & Proof Preview */}
                        <div className="flex flex-col justify-between bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-extrabold">Total Transfer:</p>
                            <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                              {formatIDR(item.amount)}
                            </p>
                          </div>

                          {item.paymentProof ? (
                            <button
                              type="button"
                              onClick={() => setZoomImage(item.paymentProof || null)}
                              className="mt-2 flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/30"
                            >
                              <span className="flex items-center gap-1">
                                <IconEye className="size-3.5" /> Lihat Bukti Transfer
                              </span>
                              <IconZoomIn className="size-3.5" />
                            </button>
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic mt-2">Belum upload foto resi</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProofItem(item);
                          setModalErrorMsg(null);
                        }}
                        className="text-xs font-semibold h-8 gap-1.5"
                      >
                        <IconEye className="size-4" /> Audit Detail
                      </Button>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => {
                              setRejectModalItem(item);
                              setModalErrorMsg(null);
                            }}
                            className="text-xs font-bold h-8 text-red-600 hover:bg-red-500/10 border-red-500/30 gap-1"
                          >
                            <IconX className="size-4" /> Tolak
                          </Button>
                          <Button
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => handleApprovePayment(item.id)}
                            className="text-xs font-bold h-8 bg-emerald-600 hover:bg-emerald-500 text-white gap-1 shadow-xs"
                          >
                            {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                            Setujui (PAID)
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AUDIT DETAIL MODAL */}
      {selectedProofItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <IconShieldCheck className="size-5 text-amber-500" /> Audit Pembayaran SaaS
              </h3>
              <button
                onClick={() => {
                  setSelectedProofItem(null);
                  setModalErrorMsg(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <IconX className="size-5" />
              </button>
            </div>

            {modalErrorMsg && (
              <div className="flex items-start justify-between rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <div className="flex items-start gap-2">
                  <IconX className="size-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{modalErrorMsg}</span>
                </div>
                <button onClick={() => setModalErrorMsg(null)} className="text-[11px] hover:underline shrink-0 ml-2">
                  Tutup
                </button>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border font-mono">
                <div>
                  <p className="text-[10px] text-muted-foreground">Nomor Invoice:</p>
                  <p className="font-bold text-foreground">{selectedProofItem.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Status Aktif:</p>
                  <div className="mt-0.5">
                    {renderStatusBadge(selectedProofItem.status, selectedProofItem.paymentProof)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Owner / Properti:</p>
                  <p className="font-bold text-foreground">{selectedProofItem.ownerName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Paket SaaS Target:</p>
                  <p className="font-bold text-amber-600 dark:text-amber-400">{selectedProofItem.planName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Nominal Tagihan:</p>
                  <p className="font-black text-sm text-amber-600 dark:text-amber-400">
                    {formatIDR(selectedProofItem.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Tgl Dibuat:</p>
                  <p>{formatDate(selectedProofItem.createdAt)}</p>
                </div>
              </div>

              {/* Photo Proof */}
              <div>
                <p className="font-bold block mb-1 text-xs">Foto Bukti Resi Transfer:</p>
                {selectedProofItem.paymentProof ? (
                  <div
                    onClick={() => setZoomImage(selectedProofItem.paymentProof || null)}
                    className="relative rounded-xl border overflow-hidden bg-black/5 p-1 cursor-pointer group"
                  >
                    <img
                      src={selectedProofItem.paymentProof}
                      alt="Bukti Transfer"
                      className="max-h-56 w-full object-contain rounded-lg transition-all group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-1 text-xs">
                      <IconZoomIn className="size-5" /> Perbesar Foto
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed rounded-xl text-center text-muted-foreground bg-muted/20">
                    <IconAlertCircle className="size-6 mx-auto mb-1 text-amber-500" />
                    <p className="text-xs">Foto resi transfer belum diunggah.</p>
                  </div>
                )}
              </div>

              {(selectedProofItem.status === "PENDING" || selectedProofItem.status === "PENDING_VERIFICATION") ? (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => {
                      setRejectModalItem(selectedProofItem);
                      setModalErrorMsg(null);
                    }}
                    className="flex-1 text-xs font-bold text-red-600 hover:bg-red-500/10 border-red-500/30 cursor-pointer"
                  >
                    <IconX className="size-4" /> Tolak Pembayaran
                  </Button>
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleApprovePayment(selectedProofItem.id)}
                    className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1 shadow-md cursor-pointer"
                  >
                    {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                    Setujui & Aktifkan Fitur
                  </Button>
                </div>
              ) : (
                <div className="pt-2 border-t flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedProofItem(null)}
                    className="text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Tutup Modal Audit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <IconBan className="size-5 text-red-500" /> Tolak Pembayaran Invoice
            </h3>

            <div className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                Pilih alasan penolakan pembayaran untuk invoice <span className="font-mono font-bold text-foreground">{rejectModalItem.invoiceNumber}</span>:
              </p>

              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border p-2.5 bg-background font-medium focus:ring-2 focus:ring-red-500 text-xs"
              >
                <option value="Nominal transfer tidak sesuai dengan invoice">Nominal transfer tidak sesuai dengan invoice</option>
                <option value="Foto bukti transfer buram / tidak terbaca">Foto bukti transfer buram / tidak terbaca</option>
                <option value="Rekening tujuan transfer tidak terdaftar">Rekening tujuan transfer tidak terdaftar</option>
                <option value="Bukti transfer terindikasi duplikat / tidak valid">Bukti transfer terindikasi duplikat / tidak valid</option>
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectModalItem(null)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleRejectPayment}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold gap-1"
                >
                  {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconX className="size-4" />}
                  Konfirmasi Tolak
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX IMAGE MODAL */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20">
            <img src={zoomImage} alt="Zoomed Proof" className="max-h-[85vh] w-auto object-contain" />
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <IconX className="size-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

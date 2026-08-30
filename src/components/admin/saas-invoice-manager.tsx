"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconReceipt,
  IconSearch,
  IconRefresh,
  IconLoader2,
  IconCheck,
  IconX,
  IconPlus,
  IconClock,
  IconAlertCircle,
  IconPrinter,
  IconEye,
  IconFileText,
  IconCash,
  IconBuildingStore,
  IconFilter,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  ownerName: string;
  ownerEmail: string;
  planName: string;
  amount: number;
  status: "PENDING" | "PENDING_VERIFICATION" | "PAID" | "CANCELLED" | "EXPIRED";
  paymentProof?: string | null;
  dueDate: string;
  paidAt?: string | null;
  createdAt: string;
}

interface SubscriptionOption {
  id: string;
  ownerName: string;
  ownerEmail: string;
  planName: string;
}

interface InvoiceStats {
  totalMRR: number;
  totalARR: number;
  activeSubscriptionsCount: number;
  pendingInvoicesCount: number;
}

const FALLBACK_INVOICES: InvoiceItem[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-881901",
    subscriptionId: "sub-1",
    ownerName: "Fauzi Aditya Pratama",
    ownerEmail: "fauzi@arventa.id",
    planName: "Business Pro Tier",
    amount: 1499000,
    status: "PAID",
    paymentProof: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    dueDate: "2026-08-25T00:00:00.000Z",
    paidAt: "2026-08-20T10:15:00.000Z",
    createdAt: "2026-08-18T08:00:00.000Z",
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2026-881902",
    subscriptionId: "sub-2",
    ownerName: "Budi Santoso",
    ownerEmail: "budi.owner@gmail.com",
    planName: "Standard Tier",
    amount: 499000,
    status: "PENDING",
    paymentProof: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80",
    dueDate: "2026-08-22T00:00:00.000Z",
    paidAt: null,
    createdAt: "2026-08-19T09:30:00.000Z",
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-2026-881903",
    subscriptionId: "sub-3",
    ownerName: "Siti Rahmawati",
    ownerEmail: "siti.kost@yahoo.com",
    planName: "Enterprise Custom Tier",
    amount: 2999000,
    status: "PAID",
    paymentProof: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    dueDate: "2026-08-15T00:00:00.000Z",
    paidAt: "2026-08-14T14:20:00.000Z",
    createdAt: "2026-08-10T11:00:00.000Z",
  },
  {
    id: "inv-4",
    invoiceNumber: "INV-2026-881904",
    subscriptionId: "sub-4",
    ownerName: "Hendra Wijaya",
    ownerEmail: "hendra.property@outlook.com",
    planName: "Starter Tier",
    amount: 199000,
    status: "CANCELLED",
    paymentProof: null,
    dueDate: "2026-08-05T00:00:00.000Z",
    paidAt: null,
    createdAt: "2026-08-01T15:00:00.000Z",
  },
];

export function SaasInvoiceManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionOption[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    totalMRR: 4997000,
    totalARR: 59964000,
    activeSubscriptionsCount: 12,
    pendingInvoicesCount: 1,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING_VERIFICATION" | "PENDING" | "PAID" | "CANCELLED">("ALL");

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);

  // Verification Modal State
  const [verifyInvoiceItem, setVerifyInvoiceItem] = useState<InvoiceItem | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // View Receipt Modal State
  const [receiptInvoiceItem, setReceiptInvoiceItem] = useState<InvoiceItem | null>(null);

  // Create Manual Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualDueDate, setManualDueDate] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

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

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/subscriptions", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.invoices && json.data.invoices.length > 0) {
          setInvoices(json.data.invoices);
        } else {
          setInvoices(FALLBACK_INVOICES);
        }

        if (json.data.subscriptions) {
          setSubscriptions(
            json.data.subscriptions.map((s: any) => ({
              id: s.id,
              ownerName: s.ownerName,
              ownerEmail: s.ownerEmail,
              planName: s.planName,
            }))
          );
        }

        if (json.data.stats) {
          setStats(json.data.stats);
        }
      } else {
        setInvoices(FALLBACK_INVOICES);
      }
    } catch (err) {
      console.error("Failed to load SaaS invoices:", err);
      setInvoices(FALLBACK_INVOICES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyInvoiceStatus = async (invoiceId: string, newStatus: "PAID" | "CANCELLED") => {
    setIsVerifying(true);
    setModalErrorMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_INVOICE",
          invoiceId,
          status: newStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(
          `Status tagihan invoice berhasil diperbarui menjadi ${newStatus === "PAID" ? "LUNAS (PAID)" : "DIBATALKAN (CANCELLED)"}`
        );
        setVerifyInvoiceItem(null);
        setModalErrorMsg(null);
        fetchData();
      } else {
        setModalErrorMsg(json.message || "Gagal memverifikasi tagihan invoice");
        setErrorMsg(json.message || "Gagal memverifikasi tagihan invoice");
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Terjadi kesalahan sistem saat memverifikasi invoice.");
      setErrorMsg("Terjadi kesalahan sistem saat memverifikasi invoice.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId || !manualAmount) {
      setModalErrorMsg("Langganan owner dan nominal tagihan wajib diisi");
      return;
    }

    setIsSubmittingManual(true);
    setModalErrorMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_INVOICE",
          subscriptionId: selectedSubId,
          amount: manualAmount.replace(/[^0-9]/g, ""),
          dueDate: manualDueDate || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message || "Tagihan invoice manual berhasil dibuat");
        setShowCreateModal(false);
        setSelectedSubId("");
        setManualAmount("");
        setManualDueDate("");
        setModalErrorMsg(null);
        fetchData();
      } else {
        setModalErrorMsg(json.message || "Gagal membuat invoice manual");
        setErrorMsg(json.message || "Gagal membuat invoice manual");
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Terjadi kesalahan sistem saat membuat invoice manual.");
      setErrorMsg("Terjadi kesalahan sistem saat membuat invoice manual.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async (inv: any) => {
    if (!inv) return;
    setIsGeneratingPDF(true);

    try {
      let jspdfLib = (window as any).jspdf;
      if (!jspdfLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
        jspdfLib = (window as any).jspdf;
      }

      const { jsPDF } = jspdfLib;
      const isPaid = inv.status === "PAID";
      const statusText = isPaid
        ? "LUNAS (PAID)"
        : inv.status === "PENDING_VERIFICATION"
        ? "MENUNGGU VERIFIKASI"
        : inv.status === "PENDING"
        ? "BELUM DIBAYAR"
        : "DIBATALKAN";

      const doc = new jsPDF("p", "mm", "a4");

      // Outer Card Box
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 12, 186, 265, 4, 4, "FD");

      // Accent Line Top
      doc.setFillColor(143, 162, 138);
      doc.rect(20, 20, 170, 2, "F");

      // Brand Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(36, 40, 35);
      doc.text("ARVENTA", 20, 32);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("SAAS PROPERTY MANAGEMENT PLATFORM", 20, 37);

      // Invoice Badge & Info (Right Side)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(143, 162, 138);
      doc.text("INVOICE & KWITANSI RESMI", 190, 28, { align: "right" });

      doc.setFont("courier", "bold");
      doc.setFontSize(13);
      doc.setTextColor(180, 83, 9);
      doc.text(inv.invoiceNumber, 190, 34, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const dateStr = `Tgl Penerbitan: ${new Date(inv.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
      doc.text(dateStr, 190, 39, { align: "right" });

      // Line Separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, 44, 190, 44);

      // Customer Box (Left)
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 50, 81, 26, 3, 3, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, 50, 81, 26, 3, 3, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("DITERBITKAN UNTUK (PELANGGAN):", 24, 56);

      const ownerNameText = inv.ownerName || inv.owner?.fullName || inv.subscription?.owner?.fullName || "Owner Properti";
      const ownerEmailText = inv.ownerEmail || inv.owner?.email || inv.subscription?.owner?.email || "-";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(ownerNameText, 24, 63);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(ownerEmailText, 24, 69);

      // Status Box (Right)
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(109, 50, 81, 26, 3, 3, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(109, 50, 81, 26, 3, 3, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("STATUS TAGIHAN & JATUH TEMPO:", 113, 56);

      if (isPaid) {
        doc.setFillColor(220, 252, 231);
        doc.setDrawColor(134, 239, 172);
        doc.roundedRect(113, 58, 48, 6.5, 3, 3, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(21, 128, 61);
        doc.text(statusText, 137, 62.5, { align: "center" });
      } else {
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(253, 230, 138);
        doc.roundedRect(113, 58, 48, 6.5, 3, 3, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9);
        doc.text(statusText, 137, 62.5, { align: "center" });
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const dueDateStr = `Jatuh Tempo: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}`;
      doc.text(dueDateStr, 113, 71);

      // Items Table Header
      const startY = 84;
      doc.setFillColor(36, 40, 35);
      doc.rect(20, startY, 170, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("DESKRIPSI LAYANAN SAAS", 24, startY + 5.5);
      doc.text("DURASI", 125, startY + 5.5, { align: "center" });
      doc.text("TOTAL NOMINAL", 186, startY + 5.5, { align: "right" });

      // Table Rows
      let currentY = startY + 8;
      const items = Array.isArray(inv.items) && inv.items.length > 0
        ? inv.items
        : [{ itemTitle: `Langganan SaaS Platform - ${inv.planName || "Paket SaaS"}`, amount: inv.amount }];

      items.forEach((item: any, idx: number) => {
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
        doc.rect(20, currentY, 170, 9, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(item.itemTitle || "Layanan SaaS", 24, currentY + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("1 Bulan", 125, currentY + 6, { align: "center" });

        doc.setFont("courier", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(180, 83, 9);
        doc.text(formatIDR(item.amount || 0), 186, currentY + 6, { align: "right" });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(20, currentY + 9, 190, currentY + 9);

        currentY += 9;
      });

      // Summary
      currentY += 8;
      const sumBoxX = 120;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Subtotal:", sumBoxX, currentY);
      doc.setFont("courier", "normal");
      doc.text(formatIDR(inv.amount || 0), 190, currentY, { align: "right" });

      currentY += 6;
      doc.setFont("helvetica", "normal");
      doc.text("Pajak (0% Included):", sumBoxX, currentY);
      doc.setFont("courier", "normal");
      doc.text("Rp 0", 190, currentY, { align: "right" });

      currentY += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(sumBoxX, currentY, 190, currentY);

      currentY += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(180, 83, 9);
      doc.text("TOTAL BAYAR:", sumBoxX, currentY);
      doc.setFont("courier", "bold");
      doc.setFontSize(11);
      doc.text(formatIDR(inv.amount || 0), 190, currentY, { align: "right" });

      currentY += 2;
      doc.line(sumBoxX, currentY, 190, currentY);

      // Footer
      const footerY = Math.max(currentY + 25, 235);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(20, footerY, 190, footerY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Catatan Resmi / Disclaimer:", 20, footerY + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(
        "Dokumen ini diterbitkan secara resmi oleh ARVENTA SaaS Billing Controller. Berkelayakan hukum sebagai bukti kwitansi transaksi langganan yang sah.",
        20,
        footerY + 10,
        { maxWidth: 120 }
      );

      // Stamp Mark
      if (isPaid) {
        doc.setDrawColor(21, 128, 61);
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(145, footerY + 4, 45, 12, 2, 2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(21, 128, 61);
        doc.text("VERIFIED PAID", 167.5, footerY + 11.5, { align: "center" });
      } else {
        doc.setDrawColor(180, 83, 9);
        doc.setFillColor(254, 243, 199);
        doc.roundedRect(145, footerY + 4, 45, 12, 2, 2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(180, 83, 9);
        doc.text("PENDING AUDIT", 167.5, footerY + 11.5, { align: "center" });
      }

      doc.save(`Invoice-${inv.invoiceNumber}.pdf`);
    } catch (err) {
      console.error("Direct PDF export error:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesQuery =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.planName.toLowerCase().includes(searchQuery.toLowerCase());

    const isPendingVerif = inv.status === "PENDING_VERIFICATION" || (inv.status === "PENDING" && Boolean(inv.paymentProof));
    const isUnpaid = inv.status === "PENDING" && !inv.paymentProof;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING_VERIFICATION" && isPendingVerif) ||
      (statusFilter === "PENDING" && isUnpaid) ||
      inv.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const totalPaidRevenue = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((acc, inv) => acc + inv.amount, 0);

  const pendingVerificationCount = invoices.filter(
    (inv) => inv.status === "PENDING_VERIFICATION" || (inv.status === "PENDING" && Boolean(inv.paymentProof))
  ).length;
  const unpaidCount = invoices.filter((inv) => inv.status === "PENDING" && !inv.paymentProof).length;
  const paidCount = invoices.filter((inv) => inv.status === "PAID").length;
  const cancelledCount = invoices.filter((inv) => inv.status === "CANCELLED" || inv.status === "EXPIRED").length;

  return (
    <div className="space-y-6">
      {/* Header Banner (ARVENTA Brand Theme) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconReceipt className="mr-1 size-3.5 text-[#C8A96B]" /> BILLING & SAAS INVOICE CONTROLLER
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Manajemen Tagihan & Invoice SaaS
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300">
              Kelola pembayaran langganan owner, verifikasi bukti transfer, cetak kwitansi invoice resmi, dan pantau arus kas SaaS.
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
            <Button
              size="sm"
              onClick={() => {
                setShowCreateModal(true);
                setModalErrorMsg(null);
              }}
              className="gap-1.5 font-bold text-xs bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white rounded-xl shadow-sm"
            >
              <IconPlus className="size-4" /> Buat Invoice Manual
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Pendapatan (Paid)</p>
              <h3 className="text-xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                {formatIDR(totalPaidRevenue || stats.totalMRR)}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{paidCount} tagihan lunas terkonfirmasi</p>
            </div>
            <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <IconCash className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Menunggu Verifikasi</p>
              <h3 className="text-xl font-black tracking-tight text-amber-600 dark:text-amber-400 mt-1">
                {pendingVerificationCount} Invoice
              </h3>
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 font-medium">
                Memerlukan persetujuan admin
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
              <p className="text-xs font-semibold text-muted-foreground">Tagihan Lunas (PAID)</p>
              <h3 className="text-xl font-black tracking-tight text-foreground mt-1">
                {paidCount} Transaksi
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Berhasil memperpanjang fitur</p>
            </div>
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <IconShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Dibatalkan / Expired</p>
              <h3 className="text-xl font-black tracking-tight text-muted-foreground mt-1">
                {cancelledCount} Invoice
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Batas waktu pembayaran lewat</p>
            </div>
            <div className="size-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center border">
              <IconX className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Notifications */}
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

      {/* Filter and Search Controls */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconFilter className="size-5 text-amber-500" />
              Daftar Tagihan SaaS Invoice ({filteredInvoices.length} Ditemukan)
            </CardTitle>
            <CardDescription>
              Cari dan filter berdasarkan nomor invoice, nama owner properti, atau status pembayaran.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <IconSearch className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari Invoice / Owner / Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border bg-background pl-9 pr-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING_VERIFICATION">MENUNGGU VERIFIKASI ADMIN</option>
              <option value="PENDING">BELUM DIBAYAR</option>
              <option value="PAID">LUNAS (PAID)</option>
              <option value="CANCELLED">DIBATALKAN / EXPIRED</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <IconLoader2 className="size-8 animate-spin text-amber-500" />
              <p className="text-xs font-semibold text-muted-foreground">Memuat data tagihan invoice SaaS...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center p-12 space-y-3 border border-dashed rounded-2xl bg-muted/20">
              <IconReceipt className="size-10 text-muted-foreground mx-auto opacity-50" />
              <h4 className="font-bold text-sm">Tidak Ada Invoice Ditemukan</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tidak ada tagihan invoice yang sesuai dengan kriteria pencarian atau filter status yang dipilih.
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-2xl border bg-card/60 overflow-hidden">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === "PAID";
                const isPendingVerif = inv.status === "PENDING_VERIFICATION" || (inv.status === "PENDING" && Boolean(inv.paymentProof));
                const isUnpaid = inv.status === "PENDING" && !inv.paymentProof;
                const isCancelled = inv.status === "CANCELLED" || inv.status === "EXPIRED";

                return (
                  <div
                    key={inv.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-all text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0 border border-amber-500/20">
                        <IconReceipt className="size-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold font-mono text-sm text-foreground">
                            {inv.invoiceNumber}
                          </span>

                          {isPaid && (
                            <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 gap-1">
                              <IconCheck className="size-3" /> LUNAS (PAID)
                            </Badge>
                          )}
                          {isPendingVerif && (
                            <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 gap-1 shadow-xs">
                              <IconClock className="size-3 animate-pulse" /> MENUNGGU VERIFIKASI
                            </Badge>
                          )}
                          {isUnpaid && (
                            <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[10px] px-2 py-0.5 gap-1">
                              <IconAlertCircle className="size-3" /> BELUM DIBAYAR
                            </Badge>
                          )}
                          {isCancelled && (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] font-semibold px-2 py-0.5">
                              DIBATALKAN / EXPIRED
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
                          <span className="font-semibold text-foreground">{inv.ownerName}</span>
                          <span>•</span>
                          <span>{inv.ownerEmail}</span>
                          <span>•</span>
                          <Badge variant="secondary" className="text-[9px] font-bold">
                            {inv.planName}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-muted-foreground font-mono">
                          Dibuat: {formatDate(inv.createdAt)} • Jatuh Tempo: {formatDate(inv.dueDate)}
                          {inv.paidAt && ` • Dibayar: ${formatDate(inv.paidAt)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-muted-foreground font-medium">Total Nominal</p>
                        <p className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                          {formatIDR(inv.amount)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Verify Payment Button */}
                        {(isPendingVerif || isUnpaid) && (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/platform/payment-verification?invoiceId=${inv.id}`)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 gap-1 shadow-xs cursor-pointer"
                          >
                            <IconShieldCheck className="size-4" /> Verifikasi
                          </Button>
                        )}

                        {/* View Receipt / Invoice Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReceiptInvoiceItem(inv)}
                          className="h-8 px-2.5 text-xs font-semibold gap-1"
                        >
                          <IconEye className="size-4" /> Detail
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* VERIFY PAYMENT MODAL */}
      {verifyInvoiceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <IconShieldCheck className="size-5 text-amber-500" /> Verifikasi Pembayaran Invoice
              </h3>
              <button
                onClick={() => {
                  setVerifyInvoiceItem(null);
                  setModalErrorMsg(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <IconX className="size-5" />
              </button>
            </div>

            {/* Modal Error Alert Banner */}
            {modalErrorMsg && (
              <div className="flex items-start justify-between rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400 animate-in fade-in duration-150">
                <div className="flex items-start gap-2">
                  <IconX className="size-4 shrink-0 text-red-500 mt-0.5" />
                  <span className="leading-tight">{modalErrorMsg}</span>
                </div>
                <button type="button" onClick={() => setModalErrorMsg(null)} className="text-[11px] hover:underline shrink-0 ml-2">
                  Tutup
                </button>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nomor Invoice:</span>
                  <span className="font-bold text-foreground">{verifyInvoiceItem.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama Owner:</span>
                  <span className="font-bold text-foreground">{verifyInvoiceItem.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paket SaaS:</span>
                  <span className="font-bold text-foreground">{verifyInvoiceItem.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Nominal:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                    {formatIDR(verifyInvoiceItem.amount)}
                  </span>
                </div>
              </div>

              {/* Payment Proof Preview */}
              <div>
                <label className="font-bold block mb-1.5 text-xs">Bukti Transfer Pembayaran:</label>
                {verifyInvoiceItem.paymentProof ? (
                  <div className="rounded-xl border overflow-hidden bg-black/5 p-1 text-center">
                    <img
                      src={verifyInvoiceItem.paymentProof}
                      alt="Bukti Transfer"
                      className="max-h-48 w-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed text-center text-muted-foreground bg-muted/20">
                    <IconAlertCircle className="size-6 mx-auto mb-1 opacity-60 text-amber-500" />
                    <p className="text-[11px]">Owner belum mengunggah foto bukti transfer langsung.</p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isVerifying}
                  onClick={() => handleVerifyInvoiceStatus(verifyInvoiceItem.id, "CANCELLED")}
                  className="flex-1 text-xs font-bold text-red-600 hover:bg-red-500/10 border-red-500/30"
                >
                  {isVerifying ? <IconLoader2 className="size-4 animate-spin" /> : <IconX className="size-4" />}
                  Tolak Pembayaran
                </Button>
                <Button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleVerifyInvoiceStatus(verifyInvoiceItem.id, "PAID")}
                  className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                >
                  {isVerifying ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                  Konfirmasi LUNAS (PAID)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT / INVOICE DETAIL MODAL */}
      {receiptInvoiceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-card border shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#242823] text-amber-400 font-bold">
                  <IconSparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground">ARVENTA SaaS Billing</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">Kwitansi & Invoice Resmi</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isGeneratingPDF}
                  onClick={() => handleDownloadPDF(receiptInvoiceItem)}
                  className="gap-1.5 text-xs font-bold h-8 cursor-pointer bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20 shadow-xs"
                >
                  {isGeneratingPDF ? (
                    <>
                      <IconLoader2 className="size-4 animate-spin" /> Unduh PDF...
                    </>
                  ) : (
                    <>
                      <IconPrinter className="size-4" /> Download PDF Invoice
                    </>
                  )}
                </Button>
                <button
                  onClick={() => setReceiptInvoiceItem(null)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <IconX className="size-5" />
                </button>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Diterbitkan Untuk:</p>
                  <h4 className="font-extrabold text-sm text-foreground mt-0.5">{receiptInvoiceItem.ownerName}</h4>
                  <p className="text-muted-foreground">{receiptInvoiceItem.ownerEmail}</p>
                </div>

                <div className="text-right font-mono">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Nomor Invoice:</p>
                  <p className="font-bold text-sm text-amber-600 dark:text-amber-400">{receiptInvoiceItem.invoiceNumber}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Tgl: {formatDate(receiptInvoiceItem.createdAt)}</p>
                </div>
              </div>

              {/* Status Stamp */}
              <div className="p-3 rounded-xl border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Status Pembayaran:</span>
                  <Badge
                    variant={receiptInvoiceItem.status === "PAID" ? "default" : "outline"}
                    className={receiptInvoiceItem.status === "PAID" ? "bg-emerald-600 text-white font-bold" : ""}
                  >
                    {receiptInvoiceItem.status}
                  </Badge>
                </div>
                <span className="font-mono text-muted-foreground text-[11px]">
                  Batas Tempo: {formatDate(receiptInvoiceItem.dueDate)}
                </span>
              </div>

              {/* Itemized Table */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/60 text-muted-foreground text-[11px] font-bold uppercase border-b">
                      <th className="p-3">Deskripsi Layanan</th>
                      <th className="p-3 text-right">Durasi</th>
                      <th className="p-3 text-right">Total Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono">
                    <tr>
                      <td className="p-3 font-semibold text-foreground">
                        Langganan SaaS Platform - {receiptInvoiceItem.planName}
                      </td>
                      <td className="p-3 text-right">1 Bulan</td>
                      <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400">
                        {formatIDR(receiptInvoiceItem.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-64 space-y-1.5 font-mono text-right border-t pt-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>{formatIDR(receiptInvoiceItem.amount)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Pajak (0% Included):</span>
                    <span>Rp 0</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-foreground pt-1 border-t">
                    <span>Total Pembayaran:</span>
                    <span className="text-amber-600 dark:text-amber-400">{formatIDR(receiptInvoiceItem.amount)}</span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4 border-t text-[10px] text-muted-foreground leading-relaxed">
                <p>Terima kasih telah berlangganan sistem ARVENTA Property Management SaaS Platform.</p>
                <p>Dokumen ini diterbitkan secara otomatis dan berlaku sebagai bukti kwitansi sah.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <IconPlus className="size-5 text-amber-500" /> Buat Invoice Tagihan Manual
            </h3>

            {/* Modal Error Notification */}
            {modalErrorMsg && (
              <div className="flex items-start justify-between rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400 animate-in fade-in duration-150">
                <div className="flex items-start gap-2">
                  <IconX className="size-4 shrink-0 text-red-500 mt-0.5" />
                  <span className="leading-tight">{modalErrorMsg}</span>
                </div>
                <button type="button" onClick={() => setModalErrorMsg(null)} className="text-[11px] hover:underline shrink-0 ml-2">
                  Tutup
                </button>
              </div>
            )}

            <form onSubmit={handleCreateManualInvoice} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Pilih Langganan Owner Target</label>
                <select
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background focus:ring-2 focus:ring-amber-500 text-xs font-medium"
                  required
                >
                  <option value="">-- Pilih Owner / Properti --</option>
                  {subscriptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.ownerName} ({s.ownerEmail}) - {s.planName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Nominal Tagihan (IDR)</label>
                <input
                  type="text"
                  placeholder="Contoh: 1499000"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background font-mono text-xs focus:ring-2 focus:ring-amber-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Tanggal Jatuh Tempo (Optional)</label>
                <input
                  type="date"
                  value={manualDueDate}
                  onChange={(e) => setManualDueDate(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background font-mono text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
                    setModalErrorMsg(null);
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingManual}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1"
                >
                  {isSubmittingManual ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                  Terbitkan Invoice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

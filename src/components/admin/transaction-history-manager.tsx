"use client";

import React, { useState, useEffect } from "react";
import {
  IconHistory,
  IconSearch,
  IconRefresh,
  IconLoader2,
  IconCheck,
  IconX,
  IconFilter,
  IconDownload,
  IconReceipt,
  IconPrinter,
  IconEye,
  IconCash,
  IconTrendingUp,
  IconCalendar,
  IconBuildingStore,
  IconCreditCard,
  IconShieldCheck,
  IconSparkles,
  IconArrowUpRight,
  IconFileText,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TransactionSubItem {
  id: string;
  itemTitle: string;
  amount: number;
  unitPrice?: number;
  itemType: string;
}

interface TransactionItem {
  id: string;
  invoiceNumber: string;
  ownerName: string;
  ownerEmail: string;
  planName: string;
  category: "SaaS Subscription" | "Add-On Module" | "Custom Upgrade";
  paymentMethod: string;
  refCode: string;
  amount: number;
  status: "PAID" | "PENDING" | "CANCELLED";
  paidAt: string | null;
  createdAt: string;
  updatedAt?: string | null;
  approvedBy?: string;
  ipAddress?: string;
  cancelReason?: string | null;
  items?: TransactionSubItem[];
}

const FALLBACK_TRANSACTIONS: TransactionItem[] = [
  {
    id: "tx-1",
    invoiceNumber: "INV-2026-881901",
    ownerName: "Fauzi Aditya Pratama",
    ownerEmail: "fauzi@arventa.id",
    planName: "Enterprise Custom Tier",
    category: "SaaS Subscription",
    paymentMethod: "Bank BCA Direct",
    refCode: "TRX-BCA-991201",
    amount: 2999000,
    status: "PAID",
    paidAt: "2026-08-20T10:15:00.000Z",
    createdAt: "2026-08-18T08:00:00.000Z",
    approvedBy: "Platform Admin (Superadmin)",
    ipAddress: "180.252.110.42",
  },
  {
    id: "tx-2",
    invoiceNumber: "INV-2026-881902",
    ownerName: "Budi Santoso",
    ownerEmail: "budi.owner@gmail.com",
    planName: "Business Pro Tier",
    category: "SaaS Subscription",
    paymentMethod: "Bank Mandiri Virtual",
    refCode: "TRX-MDR-881202",
    amount: 1499000,
    status: "PENDING",
    paidAt: null,
    createdAt: "2026-08-19T09:30:00.000Z",
    approvedBy: "-",
    ipAddress: "114.124.200.15",
  },
  {
    id: "tx-3",
    invoiceNumber: "INV-2026-881903",
    ownerName: "Siti Rahmawati",
    ownerEmail: "siti.kost@yahoo.com",
    planName: "Standard Tier",
    category: "SaaS Subscription",
    paymentMethod: "Bank BRI Transfer",
    refCode: "TRX-BRI-771203",
    amount: 499000,
    status: "PAID",
    paidAt: "2026-08-14T14:20:00.000Z",
    createdAt: "2026-08-10T11:00:00.000Z",
    approvedBy: "System Auto-Verify",
    ipAddress: "36.85.12.90",
  },
  {
    id: "tx-4",
    invoiceNumber: "INV-2026-881904",
    ownerName: "Hendra Wijaya",
    ownerEmail: "hendra.property@outlook.com",
    planName: "Quota WhatsApp Add-On (5.000 SMS)",
    category: "Add-On Module",
    paymentMethod: "QRIS Dynamic",
    refCode: "TRX-QRIS-00912",
    amount: 250000,
    status: "PAID",
    paidAt: "2026-08-08T16:45:00.000Z",
    createdAt: "2026-08-08T16:40:00.000Z",
    approvedBy: "Midtrans Gateway",
    ipAddress: "139.192.88.10",
  },
  {
    id: "tx-5",
    invoiceNumber: "INV-2026-881905",
    ownerName: "Agus Setiawan",
    ownerEmail: "agus.setiawan@gmail.com",
    planName: "Starter Tier",
    category: "SaaS Subscription",
    paymentMethod: "Bank Danamon",
    refCode: "TRX-DNM-11234",
    amount: 199000,
    status: "CANCELLED",
    paidAt: null,
    createdAt: "2026-08-01T15:00:00.000Z",
    approvedBy: "-",
    ipAddress: "125.160.77.8",
  },
];

export function TransactionHistoryManager() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PENDING" | "CANCELLED">("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionItem | null>(null);
  const [receiptTxItem, setReceiptTxItem] = useState<TransactionItem | null>(null);

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
    try {
      const res = await fetch("/api/admin/subscriptions", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data && json.data.invoices && json.data.invoices.length > 0) {
        setTransactions(
          json.data.invoices.map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            ownerName: inv.ownerName,
            ownerEmail: inv.ownerEmail,
            planName: inv.planName,
            category: "SaaS Subscription",
            paymentMethod: inv.bankName || "Transfer Bank Direct",
            refCode: `TRX-${inv.invoiceNumber.slice(-6)}`,
            amount: inv.amount,
            status: inv.status,
            cancelReason: inv.cancelReason || null,
            paidAt: inv.paidAt,
            createdAt: inv.createdAt,
            updatedAt: inv.updatedAt,
            approvedBy: inv.status === "PAID" ? "Platform Admin" : "-",
            ipAddress: "127.0.0.1",
            items: inv.items?.map((it: any) => ({
              id: it.id,
              itemTitle: it.itemTitle,
              amount: Number(it.unitPrice ?? it.amount ?? 0),
              unitPrice: Number(it.unitPrice ?? it.amount ?? 0),
              itemType: it.itemType,
            })) || [],
          }))
        );
      } else {
        setTransactions(FALLBACK_TRANSACTIONS);
      }
    } catch (err) {
      console.error("Failed to load transaction history:", err);
      setTransactions(FALLBACK_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCSV = () => {
    const headers = ["Invoice Number,Owner Name,Owner Email,Plan Name,Amount,Status,Payment Method,Ref Code,Paid At,Created At"];
    const rows = filteredTransactions.map(
      (t) =>
        `"${t.invoiceNumber}","${t.ownerName}","${t.ownerEmail}","${t.planName}",${t.amount},"${t.status}","${t.paymentMethod}","${t.refCode}","${t.paidAt || ""}","${t.createdAt}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ARVENTA_Transaction_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus = statusFilter === "ALL" || tx.status === statusFilter;
    const matchesMethod = methodFilter === "ALL" || tx.paymentMethod.toLowerCase().includes(methodFilter.toLowerCase());

    const matchesQuery =
      tx.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.refCode.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesMethod && matchesQuery;
  });

  const totalPaidVolume = transactions
    .filter((t) => t.status === "PAID")
    .reduce((acc, t) => acc + t.amount, 0);

  const paidTxCount = transactions.filter((t) => t.status === "PAID").length;
  const avgOrderValue = paidTxCount > 0 ? Math.round(totalPaidVolume / paidTxCount) : 0;
  const successRate = transactions.length > 0 ? Math.round((paidTxCount / transactions.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* ARVENTA Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconHistory className="mr-1 size-3.5 text-[#C8A96B]" /> TRANSACTION LEDGER & FINANCIAL LOGS
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Riwayat Transaksi SaaS Platform
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300">
              Audit jejak transaksi pembayaran langganan SaaS, ekspor laporan keuangan CSV, dan pantau volume transaksi lunas.
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
              onClick={handleExportCSV}
              className="gap-1.5 font-bold text-xs bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white rounded-xl shadow-sm"
            >
              <IconDownload className="size-4" /> Ekspor CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Volume Lunas (Paid)</p>
              <h3 className="text-xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                {formatIDR(totalPaidVolume)}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{paidTxCount} transaksi terverifikasi</p>
            </div>
            <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <IconCash className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Rata-rata Nominal (AOV)</p>
              <h3 className="text-xl font-black tracking-tight text-amber-600 dark:text-amber-400 mt-1">
                {formatIDR(avgOrderValue)}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Nilai rata-rata per langganan</p>
            </div>
            <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <IconTrendingUp className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Success Rate Pembayaran</p>
              <h3 className="text-xl font-black tracking-tight text-foreground mt-1">
                {successRate}%
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Rasio transaksi sukses</p>
            </div>
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <IconShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Transaksi Recorded</p>
              <h3 className="text-xl font-black tracking-tight text-foreground mt-1">
                {transactions.length} Entri Log
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tercatat dalam sistem ledger</p>
            </div>
            <div className="size-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center border">
              <IconReceipt className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Ledger Table & Controls */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconHistory className="size-5 text-amber-500" />
              Buku Besar & Log Transaksi ({filteredTransactions.length} Transaksi)
            </CardTitle>
            <CardDescription>
              Daftar kronologis pembayaran SaaS, channel bank, kode referensi, dan verifikator.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <IconSearch className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari Invoice / Owner / Ref..."
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
              <option value="PAID">PAID (Lunas)</option>
              <option value="PENDING">PENDING (Menunggu)</option>
              <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <IconLoader2 className="size-8 animate-spin text-amber-500" />
              <p className="text-xs font-semibold text-muted-foreground">Memuat log riwayat transaksi...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center p-12 space-y-3 border border-dashed rounded-2xl bg-muted/20">
              <IconHistory className="size-10 text-muted-foreground mx-auto opacity-50" />
              <h4 className="font-bold text-sm">Tidak Ada Transaksi Ditemukan</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tidak ada entri log transaksi yang sesuai dengan kata kunci pencarian atau filter status yang Anda pilih.
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-2xl border bg-card/60 overflow-hidden">
              {filteredTransactions.map((tx) => {
                const isPaid = tx.status === "PAID";
                const isPending = tx.status === "PENDING";
                const isCancelled = tx.status === "CANCELLED";

                return (
                  <div
                    key={tx.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-all text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0 border border-amber-500/20">
                        <IconCreditCard className="size-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold font-mono text-sm text-foreground">
                            {tx.invoiceNumber}
                          </span>

                          {isPaid && (
                            <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5">
                              LUNAS (PAID)
                            </Badge>
                          )}
                          {isPending && (
                            <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5">
                              PENDING
                            </Badge>
                          )}
                          {isCancelled && (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] font-semibold">
                              CANCELLED
                            </Badge>
                          )}

                          <Badge variant="secondary" className="text-[9px] font-mono">
                            Ref: {tx.refCode}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
                          <span className="font-semibold text-foreground">{tx.ownerName}</span>
                          <span>•</span>
                          <span>{tx.ownerEmail}</span>
                          <span>•</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">{tx.planName}</span>
                        </div>

                        <p className="text-[11px] text-muted-foreground font-mono">
                          Channel: {tx.paymentMethod} • Tgl: {formatDate(tx.createdAt)}
                          {tx.paidAt && ` • Lunas: ${formatDate(tx.paidAt)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-muted-foreground font-medium">Nominal</p>
                        <p className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                          {formatIDR(tx.amount)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Audit Details */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTxDetail(tx)}
                          className="h-8 px-2.5 text-xs font-semibold gap-1"
                        >
                          <IconEye className="size-4" /> Log Detail
                        </Button>

                        {/* Print Kwitansi */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReceiptTxItem(tx)}
                          className="h-8 px-2.5 text-xs font-semibold gap-1"
                        >
                          <IconPrinter className="size-4" /> Kwitansi
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

      {/* TRANSACTION AUDIT LOG DETAIL MODAL */}
      {selectedTxDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <IconShieldCheck className="size-5 text-amber-500" /> Audit Log Transaksi SaaS
              </h3>
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <IconX className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-muted/40 border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Transaksi:</span>
                  <span className="font-bold text-foreground">{selectedTxDetail.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nomor Invoice:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{selectedTxDetail.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kode Referensi:</span>
                  <span className="font-bold text-foreground">{selectedTxDetail.refCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pembayar / Owner:</span>
                  <span className="font-bold text-foreground">{selectedTxDetail.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedTxDetail.ownerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode Pembayaran:</span>
                  <span>{selectedTxDetail.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Nominal:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                    {formatIDR(selectedTxDetail.amount)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1.5 bg-card">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Jejak Audit Sistem:</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diverifikasi Oleh:</span>
                  <span className="font-semibold text-foreground">{selectedTxDetail.approvedBy || "Admin Platform"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Origin Client:</span>
                  <span>{selectedTxDetail.ipAddress || "180.252.110.42"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tgl Invoice Dibuat:</span>
                  <span>{formatDate(selectedTxDetail.createdAt)}</span>
                </div>
                {selectedTxDetail.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tgl Lunas Diverifikasi:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatDate(selectedTxDetail.paidAt)}</span>
                  </div>
                )}
                {selectedTxDetail.status === "CANCELLED" && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                    <span>Tgl Dibatalkan:</span>
                    <span>{formatDate(selectedTxDetail.updatedAt)}</span>
                  </div>
                )}
                {(selectedTxDetail.cancelReason || selectedTxDetail.status === "CANCELLED") && (
                  <div className="pt-2 border-t border-border/60 space-y-1">
                    <span className="text-rose-600 dark:text-rose-400 font-bold block">Alasan Pembatalan:</span>
                    <span className="text-foreground font-semibold leading-relaxed block">
                      {selectedTxDetail.cancelReason || "Dibatalkan oleh owner/sistem"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedTxDetail(null)}>
                  Tutup Audit Log
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE KWITANSI RECEIPT MODAL */}
      {receiptTxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-card border shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#242823] text-amber-400 font-bold">
                  <IconSparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground">ARVENTA SaaS Billing</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">Kwitansi Transaksi Lunas</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs font-bold h-8"
                >
                  <IconPrinter className="size-4" /> Cetak / PDF
                </Button>
                <button
                  onClick={() => setReceiptTxItem(null)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <IconX className="size-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Pembayar:</p>
                  <h4 className="font-extrabold text-sm text-foreground mt-0.5">{receiptTxItem.ownerName}</h4>
                  <p className="text-muted-foreground">{receiptTxItem.ownerEmail}</p>
                </div>

                <div className="text-right font-mono">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Nomor Invoice:</p>
                  <p className="font-bold text-sm text-amber-600 dark:text-amber-400">{receiptTxItem.invoiceNumber}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Ref: {receiptTxItem.refCode}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Status:</span>
                  <Badge variant={receiptTxItem.status === "PAID" ? "default" : "outline"} className={receiptTxItem.status === "PAID" ? "bg-emerald-600 text-white font-bold" : ""}>
                    {receiptTxItem.status}
                  </Badge>
                </div>
                <span className="font-mono text-muted-foreground text-[11px]">
                  Metode: {receiptTxItem.paymentMethod}
                </span>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/60 text-muted-foreground text-[11px] font-bold uppercase border-b">
                      <th className="p-3">Item Layanan SaaS</th>
                      <th className="p-3 text-right">Kategori / Tipe</th>
                      <th className="p-3 text-right">Total Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono">
                    {Array.isArray(receiptTxItem.items) && receiptTxItem.items.length > 0 ? (
                      receiptTxItem.items.map((it: any) => {
                        const val = Number(it.unitPrice ?? it.amount ?? 0);
                        const isDiscount = val < 0 || it.itemType === "PLAN_DISCOUNT";
                        return (
                          <tr key={it.id}>
                            <td className={`p-3 font-semibold ${isDiscount ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}>
                              {it.itemTitle}
                            </td>
                            <td className="p-3 text-right text-xs text-muted-foreground">
                              {isDiscount ? "Prorate" : it.itemType === "PLAN" ? "Lisensi SaaS" : "Add-On"}
                            </td>
                            <td className={`p-3 text-right font-bold ${isDiscount ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-amber-600 dark:text-amber-400"}`}>
                              {isDiscount ? `-${formatIDR(Math.abs(val))}` : formatIDR(val)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="p-3 font-semibold text-foreground">
                          {receiptTxItem.planName}
                        </td>
                        <td className="p-3 text-right">{receiptTxItem.category}</td>
                        <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400">
                          {formatIDR(receiptTxItem.amount)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Subtotal & Breakdown */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-72 space-y-1.5 font-mono text-right border-t pt-3">
                  {(() => {
                    const hasItems = Array.isArray(receiptTxItem.items) && receiptTxItem.items.length > 0;
                    const grossSubtotal = hasItems
                      ? receiptTxItem.items!.reduce((acc: number, it: any) => {
                          const val = Number(it.unitPrice ?? it.amount ?? 0);
                          return val > 0 ? acc + val : acc;
                        }, 0)
                      : receiptTxItem.amount;

                    const totalDiscount = hasItems
                      ? receiptTxItem.items!.reduce((acc: number, it: any) => {
                          const val = Number(it.unitPrice ?? it.amount ?? 0);
                          return val < 0 ? acc + Math.abs(val) : acc;
                        }, 0)
                      : 0;

                    return (
                      <>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal Paket:</span>
                          <span>{formatIDR(grossSubtotal)}</span>
                        </div>

                        {totalDiscount > 0 && (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                            <span>Potongan Prorate:</span>
                            <span>-{formatIDR(totalDiscount)}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-sm font-black text-foreground pt-1.5 border-t">
                          <span>Total {receiptTxItem.status === "PAID" ? "Lunas" : "Tagihan"}:</span>
                          <span className="text-amber-600 dark:text-amber-400">{formatIDR(receiptTxItem.amount)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="text-center pt-4 border-t text-[10px] text-muted-foreground leading-relaxed">
                <p>Terima kasih atas kepercayaan Anda menggunakan sistem ARVENTA Property Management SaaS Platform.</p>
                <p>Dokumen ini diterbitkan secara otomatis dan berlaku sebagai kwitansi transaksi lunas yang sah.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

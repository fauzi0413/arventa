"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  IconReceipt,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconCoin,
  IconLoader2,
  IconRefresh,
  IconUpload,
  IconEye,
  IconBuildingBank,
  IconX,
  IconChecklist,
  IconDownload,
  IconCloudUpload,
  IconTrash,
  IconFileText,
  IconFileTypePdf,
  IconExternalLink,
  IconPhoto,
  IconLink,
  IconBrandWhatsapp,
  IconCopy,
} from "@tabler/icons-react";
import ImageWithSkeleton from "@/components/common/ImageWithSkeleton";

interface TenantInvoiceItem {
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
    unit?: {
      unitNumber?: string;
      property?: {
        name?: string;
        address?: string;
        owner?: {
          id?: string;
          fullName?: string;
          phoneNumber?: string;
        };
      };
    };
  };
}

interface PaymentMethod {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  notes?: string | null;
}

export function TenantInvoicesView() {
  const [invoices, setInvoices] = useState<TenantInvoiceItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
    count: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modals
  const [payModalInvoice, setPayModalInvoice] = useState<TenantInvoiceItem | null>(null);
  const [detailModalInvoice, setDetailModalInvoice] = useState<TenantInvoiceItem | null>(null);

  // Pay form state
  const [receiptUrl, setReceiptUrl] = useState("");
  const [submittingPay, setSubmittingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // File Upload & Drag & Drop State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Copy account number state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyAccountNumber = (id: string, accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 2000);
  };

  const fetchTenantInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/invoices");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memuat tagihan tenant.");
      }
      setInvoices(json.data || []);
      if (json.meta?.stats) setStats(json.meta.stats);
      if (json.meta?.paymentMethods) setPaymentMethods(json.meta.paymentMethods);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data tagihan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenantInvoices();
  }, [fetchTenantInvoices]);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    // Validate size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setPayError("Ukuran file terlalu besar. Maksimal 10 MB.");
      return;
    }

    // Validate type (images or pdf)
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      setPayError("Format file tidak didukung. Harap unggah file Gambar (JPG, PNG, WEBP) atau PDF.");
      return;
    }

    setPayError(null);
    setSelectedFile(file);

    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null); // PDF file does not generate image blob preview
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleClearFile = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalInvoice) return;

    let finalReceiptUrl = receiptUrl.trim();

    if (!selectedFile && !finalReceiptUrl) {
      setPayError("Harap tarik/pilih file bukti transfer (Gambar atau PDF) terlebih dahulu.");
      return;
    }

    if (selectedFile) {
      setSubmittingPay(true);
      setPayError(null);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("bucket", "tenant-receipts");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          throw new Error(uploadJson.message || "Gagal mengunggah file bukti bayar ke server.");
        }

        finalReceiptUrl = uploadJson.data?.url || "";
      } catch (err: any) {
        setPayError(err.message || "Terjadi kesalahan saat mengunggah file.");
        setSubmittingPay(false);
        return;
      }
    }

    if (!finalReceiptUrl) {
      setPayError("File bukti transfer wajib diunggah.");
      setSubmittingPay(false);
      return;
    }

    setSubmittingPay(true);
    setPayError(null);

    try {
      const res = await fetch(`/api/portal/invoices/${payModalInvoice.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReceipt: finalReceiptUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengunggah bukti pembayaran.");
      }

      setPayModalInvoice(null);
      setReceiptUrl("");
      handleClearFile();
      fetchTenantInvoices();
    } catch (err: any) {
      setPayError(err.message || "Gagal mengirim bukti bayar.");
    } finally {
      setSubmittingPay(false);
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
            <IconCheck className="h-3 w-3" /> LUNAS
          </span>
        );
      case "PENDING_VERIFICATION":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800">
            <IconClock className="h-3 w-3" /> MENUNGGU VERIFIKASI
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">
            <IconAlertTriangle className="h-3 w-3" /> OVERDUE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
            <IconClock className="h-3 w-3" /> BELUM DIBAYAR
          </span>
        );
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (selectedStatus === "ALL") return true;
    if (selectedStatus === "PENDING")
      return inv.status === "PENDING" || inv.status === "PENDING_VERIFICATION";
    return inv.status === selectedStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <IconReceipt className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Tagihan &amp; Pembayaran Saya
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Lihat riwayat invoice sewa bulanan, upload bukti transfer pembayaran, dan unduh kuitansi digital.
          </p>
        </div>

        <button
          onClick={fetchTenantInvoices}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2.5 shadow-sm transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Semua Tagihan</span>
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <IconCoin className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{formatIDR(stats.totalAmount)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{stats.count} transaksi invoice</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-2 shadow-sm dark:bg-amber-950/20 dark:border-amber-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Perlu Dibayar</span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 border border-amber-200 dark:bg-amber-900/60 dark:text-amber-300">
              <IconClock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{formatIDR(stats.pendingAmount)}</p>
          <p className="text-[11px] text-amber-600/90 dark:text-amber-400/80">Tagihan belum dilunasi</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-2 shadow-sm dark:bg-emerald-950/20 dark:border-emerald-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Sudah Lunas</span>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300">
              <IconCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatIDR(stats.paidAmount)}</p>
          <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/80">Pembayaran disetujui</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 space-y-2 shadow-sm dark:bg-rose-950/20 dark:border-rose-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Menunggak (Overdue)</span>
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700 border border-rose-200 dark:bg-rose-900/60 dark:text-rose-300">
              <IconAlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{formatIDR(stats.overdueAmount)}</p>
          <p className="text-[11px] text-rose-600/90 dark:text-rose-400/80">Lewati tanggal jatuh tempo</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { key: "ALL", label: "Semua Tagihan" },
          { key: "PENDING", label: "Perlu Dibayar" },
          { key: "PAID", label: "Sudah Lunas" },
          { key: "OVERDUE", label: "Overdue (Menunggak)" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedStatus === tab.key
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
            <IconLoader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-xs font-medium">Memuat tagihan sewa Anda...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 font-medium">{error}</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <IconReceipt className="h-6 w-6" />
            </div>
            <p className="font-bold text-base text-slate-900 dark:text-white">Tidak ada tagihan</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Belum ada tagihan sewa yang sesuai dengan filter kategori saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-4 py-3.5">No. Invoice</th>
                  <th className="px-4 py-3.5">Properti &amp; Unit</th>
                  <th className="px-4 py-3.5">Rincian Biaya</th>
                  <th className="px-4 py-3.5 text-right">Total Tagihan</th>
                  <th className="px-4 py-3.5">Jatuh Tempo</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {filteredInvoices.map((inv) => {
                  const propertyName = inv.lease?.unit?.property?.name || "Properti";
                  const unitNumber = inv.lease?.unit?.unitNumber || "-";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        #{inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{propertyName}</div>
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Unit {unitNumber}</div>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 font-medium">
                        <div>Sewa Pokok: {formatIDR(inv.amount)}</div>
                        {Number(inv.utilityAmount || 0) > 0 && <div>Utilitas: {formatIDR(inv.utilityAmount)}</div>}
                        {Number(inv.penaltyAmount || 0) > 0 && <div className="text-rose-500 font-bold">Denda: +{formatIDR(inv.penaltyAmount)}</div>}
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white text-right whitespace-nowrap">
                        {formatIDR(inv.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                        {new Date(inv.dueDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(inv.status)}</td>
                      <td className="px-4 py-3.5 text-left whitespace-nowrap">
                        <div className="flex items-center justify-start gap-2">
                          <button
                            onClick={() => setDetailModalInvoice(inv)}
                            className="flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-bold transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                          >
                            <IconEye className="h-3.5 w-3.5" /> Detail
                          </button>

                          {(inv.status === "PENDING" || inv.status === "OVERDUE") && (
                            <button
                              onClick={() => {
                                setPayModalInvoice(inv);
                                setReceiptUrl(inv.paymentReceipt || "");
                                setPayError(null);
                              }}
                              className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all"
                            >
                              <IconUpload className="h-3.5 w-3.5" /> Bayar / Bukti
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay / Upload Receipt Modal */}
      {payModalInvoice && (() => {
        const owner = payModalInvoice.lease?.unit?.property?.owner;
        const ownerPhone = (() => {
          if (!owner?.phoneNumber) return "";
          let cleaned = owner.phoneNumber.replace(/\D/g, "");
          if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
          return cleaned;
        })();

        const ownerName = owner?.fullName || "Pemilik Properti";
        const propertyName = payModalInvoice.lease?.unit?.property?.name || "Properti";
        const unitNumber = payModalInvoice.lease?.unit?.unitNumber || "-";
        const invoiceNumber = payModalInvoice.invoiceNumber;
        const totalAmountFormatted = formatIDR(payModalInvoice.totalAmount);

        const waMessage = encodeURIComponent(
          `Halo ${ownerName}, saya ingin mengonfirmasi pembayaran sewa untuk Invoice #${invoiceNumber} (${propertyName}, Unit ${unitNumber}) sebesar ${totalAmountFormatted}. Berhubung belum ada rekening transfer di portal, boleh minta informasi nomor rekening bank untuk pembayaran?`
        );

        const waLink = ownerPhone ? `https://wa.me/${ownerPhone}?text=${waMessage}` : null;
        const hasPaymentMethods = paymentMethods.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl text-slate-900 overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                    <IconBuildingBank className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      {hasPaymentMethods ? "Pembayaran & Unggah Bukti" : "Informasi Pembayaran Tagihan"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Invoice #{payModalInvoice.invoiceNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPayModalInvoice(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>

              {hasPaymentMethods ? (
                <form onSubmit={handlePaySubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  {payError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 font-medium">
                      {payError}
                    </div>
                  )}

                  {/* Total Amount Card */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex justify-between items-center dark:bg-emerald-950/30 dark:border-emerald-800">
                    <div>
                      <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Total Nominal Tagihan:</span>
                      <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                        {formatIDR(payModalInvoice.totalAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Jatuh Tempo:</span>
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {new Date(payModalInvoice.dueDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Bank Instructions */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Instruksi Transfer Bank Pengelola:</label>
                    <div className="space-y-2">
                      {paymentMethods.map((pm) => (
                        <div
                          key={pm.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs flex justify-between items-center dark:bg-slate-800 dark:border-slate-700"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{pm.bankName}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">a.n {pm.accountHolder}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                              {pm.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyAccountNumber(pm.id, pm.accountNumber)}
                              title="Salin Nomor Rekening"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-emerald-800 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all shadow-xs"
                            >
                              {copiedId === pm.id ? (
                                <IconCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <IconCopy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Receipt File Upload / Drag & Drop Dropzone */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <IconUpload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Bukti Transfer Pembayaran *
                    </label>

                    <div>
                      <label
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative block w-full rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all ${
                          isDragging
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-4 ring-emerald-500/20"
                            : selectedFile
                            ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                            : "border-slate-300 hover:border-emerald-500 bg-slate-50/80 hover:bg-slate-100/80 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*,.pdf,application/pdf"
                          onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                          className="sr-only"
                        />

                        {!selectedFile ? (
                          <div className="space-y-2.5">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 shadow-xs">
                              <IconCloudUpload className="h-6 w-6 stroke-[2]" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-white">
                                Tarik &amp; Lepas File Bukti Transfer di Sini
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Mendukung Gambar (<span className="font-semibold text-slate-700 dark:text-slate-300">JPG, PNG, WEBP</span>) &amp; Dokumen (<span className="font-semibold text-slate-700 dark:text-slate-300">PDF</span>)
                              </p>
                            </div>
                            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-[11px] font-bold text-emerald-700 shadow-xs border border-slate-200 hover:border-emerald-300 dark:bg-slate-900 dark:text-emerald-400 dark:border-slate-700">
                              <IconUpload className="h-3.5 w-3.5" /> Pilih File dari Perangkat
                            </div>
                            <p className="text-[10px] text-slate-400">Maksimal ukuran file: 10 MB</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* File Preview Card */}
                            {previewUrl ? (
                              <div className="relative max-h-40 mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-xs group flex items-center justify-center">
                                <ImageWithSkeleton
                                  src={previewUrl}
                                  alt="Preview Bukti Pembayaran"
                                  containerClassName="max-h-40 w-full flex items-center justify-center"
                                  className="max-h-40 w-auto object-contain mx-auto"
                                />
                                <div className="absolute inset-0 z-10 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                  <IconEye className="h-4 w-4" /> Pratinjau Gambar
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-3 p-3.5 rounded-xl bg-white border border-rose-200 dark:bg-slate-900 dark:border-rose-900/60 shadow-xs">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-black text-xs">
                                  PDF
                                </div>
                                <div className="text-left overflow-hidden">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {selectedFile.name}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                    Dokumen PDF • {(selectedFile.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Selected File Details & Actions */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <IconCheck className="h-4 w-4" /> File siap diunggah ({selectedFile.type.startsWith("image/") ? "Gambar" : "Dokumen PDF"})
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleClearFile();
                                }}
                                className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors flex items-center gap-1"
                              >
                                <IconTrash className="h-3.5 w-3.5" /> Hapus / Ganti
                              </button>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPayModalInvoice(null)}
                      className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPay}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
                    >
                      {submittingPay ? (
                        <>
                          <IconLoader2 className="h-4 w-4 animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <IconUpload className="h-4 w-4" />
                          Kirim Bukti Pembayaran
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* When paymentMethods.length === 0: Form is closed, replaced with WhatsApp contact CTA */
                <div className="p-6 space-y-5">
                  {/* Total Amount Card */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex justify-between items-center dark:bg-emerald-950/30 dark:border-emerald-800">
                    <div>
                      <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Total Nominal Tagihan:</span>
                      <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                        {formatIDR(payModalInvoice.totalAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Jatuh Tempo:</span>
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {new Date(payModalInvoice.dueDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400">
                      <IconAlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Belum Ada Rekening Bank Pengelola</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      Pemilik properti belum menambahkan nomor rekening bank resmi di sistem. Form unggah bukti pembayaran ditutup sementara. Silakan hubungi pemilik properti Anda secara langsung via WhatsApp untuk koordinasi nomor rekening transfer atau pembayaran manual.
                    </p>
                  </div>

                  <div className="pt-2">
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 text-xs font-bold shadow-md transition-all active:scale-[0.99]"
                      >
                        <IconBrandWhatsapp className="h-5 w-5 shrink-0" />
                        <span>Hubungi Pemilik via WhatsApp ({owner?.phoneNumber || ownerName})</span>
                      </a>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center text-xs font-medium text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                        Nomor WhatsApp pemilik properti belum terdaftar di sistem.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPayModalInvoice(null)}
                      className="rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Detail Invoice Modal */}
      {detailModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl text-slate-900 overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/60 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <IconReceipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Rincian Invoice #{detailModalInvoice.invoiceNumber}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tagihan &amp; Kuitansi Digital</p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalInvoice(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status Tagihan:</span>
                <div>{getStatusBadge(detailModalInvoice.status)}</div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Biaya Sewa Unit:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatIDR(detailModalInvoice.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Biaya Utilitas (Air/Listrik/WiFi):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatIDR(detailModalInvoice.utilityAmount)}</span>
                </div>
                {Number(detailModalInvoice.penaltyAmount) > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Denda Keterlambatan:</span>
                    <span>{formatIDR(detailModalInvoice.penaltyAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-sm font-black">
                  <span>Total Tagihan:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatIDR(detailModalInvoice.totalAmount)}</span>
                </div>
              </div>

              {detailModalInvoice.paymentReceipt && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 text-xs text-slate-800 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200 space-y-2">
                  <div className="font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                      <IconReceipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Bukti Pembayaran Terlampir:
                    </span>
                    {(detailModalInvoice.paymentReceipt.startsWith("http") || detailModalInvoice.paymentReceipt.startsWith("data:")) && (
                      <a
                        href={detailModalInvoice.paymentReceipt}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline text-[11px] font-bold flex items-center gap-1"
                      >
                        Buka Tautan <IconExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {detailModalInvoice.paymentReceipt.match(/\.(jpeg|jpg|png|webp)($|\?)/i) || detailModalInvoice.paymentReceipt.startsWith("data:image/") ? (
                    <div className="max-h-36 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 flex items-center justify-center">
                      <ImageWithSkeleton
                        src={detailModalInvoice.paymentReceipt}
                        alt="Bukti Transfer"
                        containerClassName="max-h-36 w-full flex items-center justify-center"
                        className="max-h-36 w-auto mx-auto object-contain"
                      />
                    </div>
                  ) : detailModalInvoice.paymentReceipt.match(/\.pdf($|\?)/i) || detailModalInvoice.paymentReceipt.startsWith("data:application/pdf") ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
                      <IconFileTypePdf className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="font-bold text-[11px] truncate flex-1">Dokumen Bukti Bayar PDF</span>
                      <a
                        href={detailModalInvoice.paymentReceipt}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 text-[10px] font-bold transition-all"
                      >
                        Lihat PDF
                      </a>
                    </div>
                  ) : (
                    <p className="text-[11px] font-mono break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      {detailModalInvoice.paymentReceipt}
                    </p>
                  )}
                </div>
              )}

              {detailModalInvoice.status === "PAID" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <IconCheck className="h-4 w-4 text-emerald-600" /> Kuitansi Digital Lunas Validated
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Waktu Lunas: {detailModalInvoice.paidAt ? new Date(detailModalInvoice.paidAt).toLocaleString("id-ID") : "-"}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setDetailModalInvoice(null)}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition-all dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
